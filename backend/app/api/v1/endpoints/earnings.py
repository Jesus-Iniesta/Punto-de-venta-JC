from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.db.database import get_db
from app.models.earnings import Earnings as EarningsModel
from app.models.product import Product as ProductModel
from app.models.sales import Sales as SalesModel
from app.models.sellers import Sellers as SellersModel
from app.models.investment import Investment as InvestmentModel
from app.schemas.earnings import (
    InvestmentRecord, InvestmentResponse, EarningsSummary, EarningsByProduct, 
    EarningsByPeriod, EarningsBySeller, Earnings
)
from app.schemas.sales import SaleStatus
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User as UserModel

router = APIRouter()


@router.post(
    "/investment",
    response_model=InvestmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar inversión inicial",
    description="Registra una inversión inicial de capital en productos."
)
def register_investment(
    investment: InvestmentRecord,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Registra una inversión inicial de capital:
    
    - **amount**: Cantidad de capital invertido (debe ser > 0)
    - **description**: Descripción de la inversión
    - **date**: Fecha de la inversión
    
    Este endpoint es útil para llevar control del capital invertido inicialmente
    en la compra de productos o inicio del negocio.
    
    Solo administradores pueden registrar inversiones.
    """
    # Verificar permisos de admin
    require_admin(current_user)
    
    # Validar que el monto sea positivo
    if investment.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El monto de la inversión debe ser mayor a 0"
        )
    
    # Validar fecha (no puede ser futura)
    if investment.date > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de inversión no puede ser futura"
        )
    
    try:
        # Crear registro de inversión en la base de datos
        db_investment = InvestmentModel(
            amount=investment.amount,
            description=investment.description,
            date=investment.date,
            registered_by=current_user.username
        )
        
        db.add(db_investment)
        db.commit()
        db.refresh(db_investment)
        
        return db_investment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar la inversión: {str(e)}"
        )


@router.get(
    "/summary",
    response_model=EarningsSummary,
    summary="Resumen general de ganancias",
    description="Obtiene un resumen completo de las ganancias del negocio."
)
def get_earnings_summary(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Resumen general de ganancias:
    
    - **total_invested**: Suma de inversiones iniciales + cost_price de productos vendidos
    - **total_sold**: Suma de ventas completadas
    - **gross_profit**: Ganancia bruta (total vendido - total invertido)
    - **average_profit_margin**: Margen de ganancia promedio
    - **status**: PROFIT o LOSS
    - **total_sales**: Número total de ventas completadas
    
    Solo usuarios autenticados pueden acceder.
    """
    # Calcular total de inversiones iniciales
    total_investments_result = db.query(
        func.sum(InvestmentModel.amount)
    ).scalar()
    total_investments = float(total_investments_result) if total_investments_result else 0.0
    
    # Calcular total invertido en productos (suma de earnings.total_cost)
    total_cost_result = db.query(
        func.sum(EarningsModel.total_cost)
    ).scalar()
    total_cost = float(total_cost_result) if total_cost_result else 0.0
    
    # Total invertido = inversiones iniciales + costo de productos vendidos
    total_invested = total_investments + total_cost
    
    # Calcular total vendido (suma de earnings.total_revenue)
    total_revenue_result = db.query(
        func.sum(EarningsModel.total_revenue)
    ).scalar()
    total_sold = float(total_revenue_result) if total_revenue_result else 0.0
    
    # Calcular ganancia bruta
    gross_profit = total_sold - total_invested
    
    # Calcular margen de ganancia promedio
    avg_margin_result = db.query(
        func.avg(EarningsModel.profit_margin)
    ).scalar()
    average_profit_margin = float(avg_margin_result) if avg_margin_result else 0.0
    
    # Determinar estado
    status_value = "PROFIT" if gross_profit > 0 else "LOSS" if gross_profit < 0 else "BREAK_EVEN"
    
    # Contar ventas completadas
    total_sales = db.query(EarningsModel).count()
    
    return EarningsSummary(
        total_invested=total_invested,
        total_sold=total_sold,
        gross_profit=gross_profit,
        net_profit=None,  # Se puede calcular después de restar gastos
        average_profit_margin=average_profit_margin,
        status=status_value,
        total_sales=total_sales
    )


@router.get(
    "/by-product",
    response_model=List[EarningsByProduct],
    summary="Ganancias por producto",
    description="Obtiene un desglose de ganancias por cada producto."
)
def get_earnings_by_product(
    order_by: str = Query("profit", regex="^(profit|quantity|margin)$", description="Ordenar por: profit, quantity, margin"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Ganancias desglosadas por producto:
    
    - **quantity_sold**: Cantidad total vendida
    - **total_invested**: Total invertido en el producto
    - **total_generated**: Total generado por ventas
    - **profit**: Ganancia/pérdida
    - **profit_margin**: Margen de ganancia %
    
    Parámetros:
    - **order_by**: profit (más rentables), quantity (más vendidos), margin (mayor margen)
    """
    # Agrupar earnings por producto
    results = db.query(
        EarningsModel.product_id,
        func.sum(EarningsModel.quantity).label('quantity_sold'),
        func.sum(EarningsModel.total_cost).label('total_invested'),
        func.sum(EarningsModel.total_revenue).label('total_generated'),
        func.sum(EarningsModel.profit).label('profit'),
        func.avg(EarningsModel.profit_margin).label('profit_margin')
    ).group_by(EarningsModel.product_id).all()
    
    # Construir respuesta con nombres de productos
    earnings_list = []
    for result in results:
        product = db.query(ProductModel).filter(ProductModel.id == result.product_id).first()
        if product:
            earnings_list.append(EarningsByProduct(
                product_id=result.product_id,
                product_name=product.name,
                quantity_sold=int(result.quantity_sold) if result.quantity_sold else 0,
                total_invested=float(result.total_invested) if result.total_invested else 0.0,
                total_generated=float(result.total_generated) if result.total_generated else 0.0,
                profit=float(result.profit) if result.profit else 0.0,
                profit_margin=float(result.profit_margin) if result.profit_margin else 0.0
            ))
    
    # Ordenar según el parámetro
    if order_by == "profit":
        earnings_list.sort(key=lambda x: x.profit, reverse=True)
    elif order_by == "quantity":
        earnings_list.sort(key=lambda x: x.quantity_sold, reverse=True)
    elif order_by == "margin":
        earnings_list.sort(key=lambda x: x.profit_margin, reverse=True)
    
    return earnings_list


@router.get(
    "/by-period",
    response_model=List[EarningsByPeriod],
    summary="Ganancias por período",
    description="Obtiene ganancias agrupadas por período de tiempo."
)
def get_earnings_by_period(
    period: str = Query("month", regex="^(day|week|month|year)$", description="Período: day, week, month, year"),
    start_date: Optional[datetime] = Query(None, description="Fecha inicial (YYYY-MM-DD)"),
    end_date: Optional[datetime] = Query(None, description="Fecha final (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Ganancias por período de tiempo:
    
    - **period**: Tipo de período (day, week, month, year)
    - **start_date/end_date**: Rango de fechas
    - **total_revenue**: Ingresos del período
    - **total_cost**: Costos del período
    - **profit**: Ganancia del período
    - **profit_margin**: Margen de ganancia %
    - **sales_count**: Número de ventas
    """
    # Si no se proporcionan fechas, usar el último mes
    if not end_date:
        end_date = datetime.now(timezone.utc)
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Filtrar earnings por rango de fechas
    query = db.query(EarningsModel).filter(
        EarningsModel.created_at >= start_date,
        EarningsModel.created_at <= end_date
    )
    
    earnings = query.all()
    
    # Agrupar por período
    periods_data = {}
    
    for earning in earnings:
        # Determinar la clave del período
        if period == "day":
            period_key = earning.created_at.date()
        elif period == "week":
            period_key = earning.created_at.date() - timedelta(days=earning.created_at.weekday())
        elif period == "month":
            period_key = earning.created_at.replace(day=1).date()
        else:  # year
            period_key = earning.created_at.replace(month=1, day=1).date()
        
        if period_key not in periods_data:
            periods_data[period_key] = {
                'total_revenue': 0.0,
                'total_cost': 0.0,
                'profit': 0.0,
                'sales_count': 0
            }
        
        periods_data[period_key]['total_revenue'] += earning.total_revenue
        periods_data[period_key]['total_cost'] += earning.total_cost
        periods_data[period_key]['profit'] += earning.profit
        periods_data[period_key]['sales_count'] += 1
    
    # Construir respuesta
    result = []
    for period_date, data in sorted(periods_data.items()):
        profit_margin = (data['profit'] / data['total_revenue'] * 100) if data['total_revenue'] > 0 else 0.0
        
        # Calcular fechas de inicio y fin del período
        if period == "day":
            period_start = datetime.combine(period_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            period_end = datetime.combine(period_date, datetime.max.time()).replace(tzinfo=timezone.utc)
        elif period == "week":
            period_start = datetime.combine(period_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            period_end = datetime.combine(period_date + timedelta(days=6), datetime.max.time()).replace(tzinfo=timezone.utc)
        elif period == "month":
            period_start = datetime.combine(period_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            next_month = period_date.replace(day=28) + timedelta(days=4)
            period_end = datetime.combine((next_month - timedelta(days=next_month.day)).replace(day=1) + timedelta(days=31), datetime.max.time()).replace(tzinfo=timezone.utc)
        else:  # year
            period_start = datetime.combine(period_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            period_end = datetime.combine(period_date.replace(month=12, day=31), datetime.max.time()).replace(tzinfo=timezone.utc)
        
        result.append(EarningsByPeriod(
            period=period,
            start_date=period_start,
            end_date=period_end,
            total_revenue=data['total_revenue'],
            total_cost=data['total_cost'],
            profit=data['profit'],
            profit_margin=profit_margin,
            sales_count=data['sales_count']
        ))
    
    return result


@router.get(
    "/by-seller",
    response_model=List[EarningsBySeller],
    summary="Ganancias por vendedor",
    description="Obtiene un ranking de ganancias por vendedor."
)
def get_earnings_by_seller(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Ganancias por vendedor:
    
    - **total_sales**: Total de ventas del vendedor
    - **total_revenue**: Ingresos generados
    - **total_cost**: Costos
    - **profit**: Ganancia generada
    - **commission**: Comisión del vendedor (opcional)
    
    Ordenado por ganancia de mayor a menor.
    """
    # Obtener ventas completadas con earnings
    sales = db.query(SalesModel).filter(
        SalesModel.status == SaleStatus.COMPLETED.value
    ).all()
    
    # Agrupar por vendedor
    sellers_data = {}
    
    for sale in sales:
        seller_id = sale.seller_id
        
        if seller_id not in sellers_data:
            sellers_data[seller_id] = {
                'total_sales': 0,
                'total_revenue': 0.0,
                'total_cost': 0.0,
                'profit': 0.0
            }
        
        # Buscar earnings de esta venta
        earning = db.query(EarningsModel).filter(EarningsModel.sale_id == sale.id).first()
        if earning:
            sellers_data[seller_id]['total_sales'] += 1
            sellers_data[seller_id]['total_revenue'] += earning.total_revenue
            sellers_data[seller_id]['total_cost'] += earning.total_cost
            sellers_data[seller_id]['profit'] += earning.profit
    
    # Construir respuesta con nombres de vendedores
    result = []
    for seller_id, data in sellers_data.items():
        seller = db.query(SellersModel).filter(SellersModel.id == seller_id).first()
        if seller:
            result.append(EarningsBySeller(
                seller_id=seller_id,
                seller_name=seller.name,
                total_sales=data['total_sales'],
                total_revenue=data['total_revenue'],
                total_cost=data['total_cost'],
                profit=data['profit'],
                commission=None  # Se puede calcular basado en un porcentaje
            ))
    
    # Ordenar por ganancia (mayor a menor)
    result.sort(key=lambda x: x.profit, reverse=True)
    
    return result


@router.get(
    "/{sale_id}",
    response_model=Earnings,
    summary="Ganancia de venta específica",
    description="Obtiene el desglose de ganancia de una venta específica."
)
def get_earning_by_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Desglose completo de costo vs venta:
    
    - **cost_price**: Precio de costo al momento de la venta
    - **sale_price**: Precio de venta
    - **quantity**: Cantidad vendida
    - **total_cost**: Costo total
    - **total_revenue**: Ingreso total
    - **profit**: Ganancia
    - **profit_margin**: Margen de ganancia %
    """
    # Buscar el earning de la venta
    earning = db.query(EarningsModel).filter(EarningsModel.sale_id == sale_id).first()
    
    if not earning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró registro de ganancia para la venta {sale_id}"
        )
    
    return earning


@router.put(
    "/earning/{earning_id}",
    response_model=Earnings,
    summary="Actualizar registro de earning",
    description="Permite corregir valores de un registro de earnings por errores."
)
def update_earning(
    earning_id: int,
    cost_price: Optional[float] = Query(None, gt=0, description="Nuevo precio de costo"),
    sale_price: Optional[float] = Query(None, gt=0, description="Nuevo precio de venta"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Actualiza un registro de earnings para corregir errores:
    
    - **cost_price**: Nuevo precio de costo (recalcula totales)
    - **sale_price**: Nuevo precio de venta (recalcula totales)
    
    Los campos calculados se actualizan automáticamente:
    - total_cost, total_revenue, profit, profit_margin
    
    Solo administradores pueden realizar esta acción.
    """
    # Verificar permisos de admin
    require_admin(current_user)
    
    # Buscar el earning
    earning = db.query(EarningsModel).filter(EarningsModel.id == earning_id).first()
    
    if not earning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró registro de earning con ID {earning_id}"
        )
    
    # Actualizar precios si se proporcionaron
    if cost_price is not None:
        earning.cost_price = cost_price
        earning.total_cost = cost_price * earning.quantity
    
    if sale_price is not None:
        earning.sale_price = sale_price
        earning.total_revenue = sale_price * earning.quantity
    
    # Recalcular profit y profit_margin
    earning.profit = earning.total_revenue - earning.total_cost
    earning.profit_margin = (earning.profit / earning.total_revenue * 100) if earning.total_revenue > 0 else 0.0
    
    try:
        db.commit()
        db.refresh(earning)
        return earning
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar earning: {str(e)}"
        )


@router.get(
    "/investments",
    response_model=List[InvestmentResponse],
    summary="Listar todas las inversiones",
    description="Obtiene un listado de todas las inversiones iniciales registradas."
)
def get_investments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Lista todas las inversiones iniciales:
    
    - **amount**: Monto invertido
    - **description**: Descripción de la inversión
    - **date**: Fecha de la inversión
    - **registered_by**: Usuario que la registró
    - **created_at**: Fecha de registro
    
    Solo usuarios autenticados pueden acceder.
    """
    try:
        investments = db.query(InvestmentModel).order_by(
            InvestmentModel.date.desc()
        ).offset(skip).limit(limit).all()
        
        return investments
    except Exception as e:
        # Si la tabla no existe o hay error, retornar lista vacía
        return []
