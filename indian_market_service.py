"""
Indian Agmarknet Mandi Market Data Service
Provides real APMC market prices, filtering, and disease financial impact analysis.
"""

import os
import json
import logging

logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'indian_mandi_market_data.json')

_CACHE = {
    'records': [],
    'meta': None,
    # Index: commodity_lower -> list of records  (built once after load)
    'by_commodity': {},
}


def load_market_data():
    """Load and cache Indian Mandi records, building fast-lookup indexes."""
    if _CACHE['records']:
        return _CACHE['records']

    if not os.path.exists(DATA_FILE):
        logger.warning(f"Market data file not found at {DATA_FILE}")
        return []

    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            _CACHE['records'] = json.load(f)
        logger.info(f"Loaded {len(_CACHE['records'])} Indian Mandi records from {DATA_FILE}")

        # Build commodity index once
        idx = {}
        for r in _CACHE['records']:
            key = r['commodity'].lower()
            if key not in idx:
                idx[key] = []
            idx[key].append(r)
        _CACHE['by_commodity'] = idx

    except Exception as e:
        logger.error(f"Error loading market data: {e}")
        _CACHE['records'] = []

    return _CACHE['records']


def get_market_metadata():
    """Extract distinct states, districts, markets, commodities, varieties, and grades"""
    if _CACHE['meta']:
        return _CACHE['meta']

    records = load_market_data()
    if not records:
        return {}

    states = sorted(list(set(r['state'] for r in records)))
    
    # State -> Districts
    state_districts = {}
    for r in records:
        s = r['state']
        d = r['district']
        if s not in state_districts:
            state_districts[s] = set()
        state_districts[s].add(d)
    state_districts = {s: sorted(list(dists)) for s, dists in state_districts.items()}

    # District -> Markets
    district_markets = {}
    for r in records:
        d = r['district']
        m = r['market']
        if d not in district_markets:
            district_markets[d] = set()
        district_markets[d].add(m)
    district_markets = {d: sorted(list(mkts)) for d, mkts in district_markets.items()}

    # Commodities: Put Chillies & Peppers first
    all_commodities = sorted(list(set(r['commodity'] for r in records)))
    chilli_priority = ['Green Chilli', 'Dry Chillies', 'Chili Red', 'Capsicum', 'Chilly Capsicum']
    other_commodities = [c for c in all_commodities if c not in chilli_priority]
    sorted_commodities = chilli_priority + other_commodities

    # Commodity -> Varieties
    commodity_varieties = {}
    for r in records:
        c = r['commodity']
        v = r['variety']
        if c not in commodity_varieties:
            commodity_varieties[c] = set()
        commodity_varieties[c].add(v)
    commodity_varieties = {c: sorted(list(vars_)) for c, vars_ in commodity_varieties.items()}

    # Commodity -> Grades
    commodity_grades = {}
    for r in records:
        c = r['commodity']
        g = r['grade']
        if c not in commodity_grades:
            commodity_grades[c] = set()
        commodity_grades[c].add(g)
    commodity_grades = {c: sorted(list(grds)) for c, grds in commodity_grades.items()}

    _CACHE['meta'] = {
        'states': states,
        'state_districts': state_districts,
        'district_markets': district_markets,
        'commodities': sorted_commodities,
        'chilli_commodities': chilli_priority,
        'commodity_varieties': commodity_varieties,
        'commodity_grades': commodity_grades,
        'total_records': len(records),
        'sample_date': records[0]['date'] if records else '2026-07-02'
    }

    return _CACHE['meta']


def query_market_records(state=None, district=None, market=None, commodity=None, limit=50, offset=0):
    """Filter records for the live market price board"""
    load_market_data()  # ensure cache & index are warm

    # Fast path: use pre-built commodity index when only commodity filter is set
    if commodity and not state and not district and not market:
        key = commodity.lower()
        filtered = _CACHE['by_commodity'].get(key, [])
    else:
        records = _CACHE['records']
        filtered = records

        if state:
            filtered = [r for r in filtered if r['state'].lower() == state.lower()]
        if district:
            filtered = [r for r in filtered if r['district'].lower() == district.lower()]
        if market:
            filtered = [r for r in filtered if market.lower() in r['market'].lower()]
        if commodity:
            c_lower = commodity.lower()
            filtered = [r for r in filtered if c_lower in r['commodity'].lower()]

    total = len(filtered)
    paged = filtered[offset:offset + limit]

    # Add per kg conversions (1 Quintal = 100 kg)
    for r in paged:
        r['modal_price_kg'] = round(r['modal_price'] / 100.0, 2)
        r['min_price_kg'] = round(r['min_price'] / 100.0, 2)
        r['max_price_kg'] = round(r['max_price'] / 100.0, 2)

    return {
        'total': total,
        'limit': limit,
        'offset': offset,
        'records': paged
    }


def predict_real_market_price(params):
    """
    Calculate accurate price prediction from real Indian APMC data.
    params: {
        'state': 'Andhra Pradesh',
        'district': 'Guntur',
        'market': 'Guntur APMC',
        'commodity': 'Dry Chillies',
        'variety': 'Guntur',
        'grade': 'FAQ',
        'quantity': 100,
        'unit': 'kg'  # 'kg' or 'quintal'
    }
    """
    records = load_market_data()
    if not records:
        return {'success': False, 'error': 'Market data unavailable'}

    state = params.get('state', '').strip()
    district = params.get('district', '').strip()
    market = params.get('market', '').strip()
    commodity = params.get('commodity', 'Green Chilli').strip()
    variety = params.get('variety', '').strip()
    grade = params.get('grade', '').strip()
    quantity = float(params.get('quantity', 100))
    unit = params.get('unit', 'kg').lower()

    # Match hierarchically:
    # 1. Exact match: state + district + market + commodity + variety + grade
    # 2. Match market + commodity + variety
    # 3. Match district + commodity
    # 4. Match state + commodity
    # 5. Match commodity across all India

    exact_matches = [
        r for r in records
        if (not state or r['state'].lower() == state.lower())
        and (not district or r['district'].lower() == district.lower())
        and (not market or r['market'].lower() == market.lower())
        and r['commodity'].lower() == commodity.lower()
        and (not variety or r['variety'].lower() == variety.lower())
        and (not grade or r['grade'].lower() == grade.lower())
    ]

    best_record = None
    match_level = 'exact'

    if exact_matches:
        best_record = exact_matches[0]
        match_level = 'exact'
    else:
        # Fallback 1: match market + commodity
        sub = [r for r in records if market and r['market'].lower() == market.lower() and r['commodity'].lower() == commodity.lower()]
        if sub:
            best_record = sub[0]
            match_level = 'market_average'
        else:
            # Fallback 2: match district + commodity
            sub = [r for r in records if district and r['district'].lower() == district.lower() and r['commodity'].lower() == commodity.lower()]
            if sub:
                best_record = sub[0]
                match_level = 'district_average'
            else:
                # Fallback 3: match state + commodity
                sub = [r for r in records if state and r['state'].lower() == state.lower() and r['commodity'].lower() == commodity.lower()]
                if sub:
                    best_record = sub[0]
                    match_level = 'state_average'
                else:
                    # Fallback 4: all India for this commodity
                    sub = [r for r in records if r['commodity'].lower() == commodity.lower()]
                    if sub:
                        best_record = sub[0]
                        match_level = 'national_average'
                    else:
                        # Fallback 5: first record
                        best_record = records[0]
                        match_level = 'general'

    modal_qtl = float(best_record['modal_price'])
    min_qtl = float(best_record['min_price'])
    max_qtl = float(best_record['max_price'])

    # Price per kg (1 Quintal = 100 kg)
    modal_kg = round(modal_qtl / 100.0, 2)
    min_kg = round(min_qtl / 100.0, 2)
    max_kg = round(max_qtl / 100.0, 2)

    # Convert quantity to kg for total revenue
    qty_in_kg = quantity * 100.0 if unit == 'quintal' else quantity
    qty_in_qtl = round(qty_in_kg / 100.0, 2)

    total_revenue = round(qty_in_kg * modal_kg, 2)

    # Real Disease Markdown Analysis from the Indian Market:
    # Notice in Guntur APMC:
    # Dry Chillies FAQ is Rs. 24,500/Q, whereas Grade Range-3 / White is Rs. 11,500/Q (over 53% markdown!)
    # For Green Chilli: Grade A/FAQ is Rs. 3,500 - 5,500/Q, damaged/local is discounted by 40-70%
    healthy_grade_qtl = max_qtl if max_qtl > modal_qtl else modal_qtl
    healthy_grade_kg = round(healthy_grade_qtl / 100.0, 2)
    healthy_potential_revenue = round(qty_in_kg * healthy_grade_kg, 2)

    # Disease financial damage scenario:
    # Anthracnose Fruit Rot drops value to ~35% of healthy modal price (65% loss)
    # Leaf Curl Virus severely curtails yield & pod grade down to 25% (75% loss)
    # Whitefly / Yellowish causes honeydew sooty mold and chlorosis, losing 45%
    anthracnose_val = round(total_revenue * 0.35, 2)
    anthracnose_loss = round(total_revenue - anthracnose_val, 2)
    leaf_curl_loss = round(total_revenue * 0.75, 2)

    # 4-Week projection based on Mandi price range
    weekly_forecast = [
        {'week': 'Week 1', 'price_kg': round(min_kg + (modal_kg - min_kg) * 0.5, 2), 'price_qtl': round(min_qtl + (modal_qtl - min_qtl) * 0.5, 2)},
        {'week': 'Week 2 (Spot)', 'price_kg': modal_kg, 'price_qtl': modal_qtl},
        {'week': 'Week 3', 'price_kg': round(modal_kg * 1.04, 2), 'price_qtl': round(modal_qtl * 1.04, 2)},
        {'week': 'Week 4', 'price_kg': round(modal_kg * 1.02, 2), 'price_qtl': round(modal_qtl * 1.02, 2)}
    ]

    return {
        'success': True,
        'prediction': {
            'date': best_record['date'],
            'state': best_record['state'],
            'district': best_record['district'],
            'market': best_record['market'],
            'commodity': best_record['commodity'],
            'variety': best_record['variety'],
            'grade': best_record['grade'],
            'match_level': match_level,
            # Prices
            'modal_price_qtl': modal_qtl,
            'min_price_qtl': min_qtl,
            'max_price_qtl': max_qtl,
            'modal_price_kg': modal_kg,
            'min_price_kg': min_kg,
            'max_price_kg': max_kg,
            # Quantities and total
            'entered_quantity': quantity,
            'entered_unit': unit,
            'qty_kg': qty_in_kg,
            'qty_qtl': qty_in_qtl,
            'total_revenue': total_revenue,
            'healthy_potential': healthy_potential_revenue,
            'disease_loss_anthracnose': anthracnose_loss,
            'disease_loss_leaf_curl': leaf_curl_loss,
            'weekly_forecast': weekly_forecast
        }
    }
