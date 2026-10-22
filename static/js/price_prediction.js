/**
 * Indian Agmarknet APMC Mandi Market Price Prediction & Analysis
 * Fully rewritten for reliability - safe element access, parallel API calls,
 * lazy table loading, and graceful error recovery.
 */

(function () {
    'use strict';

    function el(id) { return document.getElementById(id); }
    function setText(id, text) { var e = el(id); if (e) e.textContent = text; }
    function setHTML(id, html) { var e = el(id); if (e) e.innerHTML = html; }

    function animateNumber(element, end, duration) {
        if (!element) return;
        var startTs = null;
        function step(ts) {
            if (!startTs) startTs = ts;
            var progress = Math.min((ts - startTs) / duration, 1);
            element.textContent = Math.floor(progress * end).toLocaleString();
            if (progress < 1) requestAnimationFrame(step);
            else element.textContent = end.toLocaleString();
        }
        requestAnimationFrame(step);
    }

    var marketMeta = null;
    var currentTableOffset = 0;
    var TABLE_LIMIT = 25;
    var totalTableRecords = 0;
    var tableLoaded = false;

    var form            = el('pricePredictForm');
    var stateSelect     = el('stateSelect');
    var districtSelect  = el('districtSelect');
    var marketSelect    = el('marketSelect');
    var commoditySelect = el('commoditySelect');
    var varietySelect   = el('varietySelect');
    var gradeSelect     = el('gradeSelect');
    var quantityInput   = el('harvestQuantity');
    var mandiTableBody  = el('mandiTableBody');
    var btnPrev         = el('btnPrevPage');
    var btnNext         = el('btnNextPage');
    var tableSearch     = el('tableSearchInput');
    var tableCommodity  = el('tableCommodityFilter');

    if (!form) return;

    // Always prevent form GET submit
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        calculatePrediction();
        return false;
    });

    document.querySelectorAll('.preset-chip').forEach(function(chip) {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.preset-chip').forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            if (quantityInput) quantityInput.value = this.getAttribute('data-qty');
            calculatePrediction();
        });
    });

    if (quantityInput) quantityInput.addEventListener('input', calculatePrediction);
    document.querySelectorAll('input[name="qtyUnit"]').forEach(function(r) {
        r.addEventListener('change', calculatePrediction);
    });

    if (stateSelect)    stateSelect.addEventListener('change',    function() { updateDistricts(); calculatePrediction(); });
    if (districtSelect) districtSelect.addEventListener('change', function() { updateMarkets();   calculatePrediction(); });
    if (marketSelect)   marketSelect.addEventListener('change',   calculatePrediction);
    if (commoditySelect) commoditySelect.addEventListener('change', function() { updateVarietiesAndGrades(); calculatePrediction(); });
    if (varietySelect)  varietySelect.addEventListener('change',  calculatePrediction);
    if (gradeSelect)    gradeSelect.addEventListener('change',    calculatePrediction);

    if (btnPrev) btnPrev.addEventListener('click', function() {
        if (currentTableOffset >= TABLE_LIMIT) { currentTableOffset -= TABLE_LIMIT; fetchTableRecords(); }
    });
    if (btnNext) btnNext.addEventListener('click', function() {
        if (currentTableOffset + TABLE_LIMIT < totalTableRecords) { currentTableOffset += TABLE_LIMIT; fetchTableRecords(); }
    });
    var searchTimer = null;
    if (tableSearch) tableSearch.addEventListener('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() { currentTableOffset = 0; fetchTableRecords(); }, 350);
    });
    if (tableCommodity) tableCommodity.addEventListener('change', function() {
        currentTableOffset = 0; fetchTableRecords();
    });

    function updateDistricts() {
        if (!marketMeta || !stateSelect || !districtSelect) return;
        var state = stateSelect.value;
        var districts = marketMeta.state_districts[state] || [];
        districtSelect.innerHTML = districts.map(function(d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');
        if (state === 'Andhra Pradesh' && districts.indexOf('Guntur') > -1) districtSelect.value = 'Guntur';
        else if (districts.length) districtSelect.value = districts[0];
        updateMarkets();
    }

    function updateMarkets() {
        if (!marketMeta || !districtSelect || !marketSelect) return;
        var district = districtSelect.value;
        var markets = marketMeta.district_markets[district] || [];
        marketSelect.innerHTML = markets.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('');
        if (district === 'Guntur' && markets.indexOf('Guntur APMC') > -1) marketSelect.value = 'Guntur APMC';
        else if (markets.length) marketSelect.value = markets[0];
    }

    function updateVarietiesAndGrades() {
        if (!marketMeta || !commoditySelect) return;
        var commodity = commoditySelect.value;
        var varieties = marketMeta.commodity_varieties[commodity] || ['Other'];
        if (varietySelect) {
            varietySelect.innerHTML = varieties.map(function(v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
            varietySelect.value = varieties[0];
        }
        var grades = marketMeta.commodity_grades[commodity] || ['FAQ'];
        if (gradeSelect) {
            gradeSelect.innerHTML = grades.map(function(g) { return '<option value="' + g + '">' + g + '</option>'; }).join('');
            gradeSelect.value = grades[0];
        }
    }

    function initializeDropdowns() {
        if (!marketMeta) return;
        if (stateSelect) {
            stateSelect.innerHTML = marketMeta.states.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
            stateSelect.value = marketMeta.states.indexOf('Andhra Pradesh') > -1 ? 'Andhra Pradesh' : marketMeta.states[0];
        }
        updateDistricts();
        if (commoditySelect) {
            commoditySelect.innerHTML = marketMeta.commodities.map(function(c) {
                var prefix = marketMeta.chilli_commodities.indexOf(c) > -1 ? '\uD83C\uDF36\uFE0F ' : '\uD83C\uDF3E ';
                return '<option value="' + c + '">' + prefix + c + '</option>';
            }).join('');
            if (marketMeta.commodities.indexOf('Dry Chillies') > -1) commoditySelect.value = 'Dry Chillies';
            else if (marketMeta.commodities.indexOf('Green Chilli') > -1) commoditySelect.value = 'Green Chilli';
        }
        updateVarietiesAndGrades();
        calculatePrediction();
    }

    function calculatePrediction() {
        var payload = {
            state:     stateSelect     ? stateSelect.value     : '',
            district:  districtSelect  ? districtSelect.value  : '',
            market:    marketSelect    ? marketSelect.value    : '',
            commodity: commoditySelect ? commoditySelect.value : '',
            variety:   varietySelect   ? varietySelect.value   : '',
            grade:     gradeSelect     ? gradeSelect.value     : '',
            quantity:  quantityInput   ? (parseFloat(quantityInput.value) || 500) : 500,
            unit:      (document.querySelector('input[name="qtyUnit"]:checked') || {value:'kg'}).value
        };

        fetch('/api/predict-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify(payload)
        })
        .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
        .then(function(data) { if (data.success && data.prediction) updatePredictionUI(data.prediction); })
        .catch(function(err) { console.warn('Prediction error:', err); });
    }

    function updatePredictionUI(p) {
        animateNumber(el('predictedPriceKg'),      Math.round(p.modal_price_kg),  350);
        animateNumber(el('predictedPriceQtl'),     Math.round(p.modal_price_qtl), 350);
        animateNumber(el('predictedTotalRevenue'), Math.round(p.total_revenue),   500);

        setText('priceRangeTextKg',  'Range: \u20B9' + p.min_price_kg.toLocaleString() + ' \u2013 \u20B9' + p.max_price_kg.toLocaleString() + ' / kg');
        setText('priceRangeTextQtl', 'Range: \u20B9' + p.min_price_qtl.toLocaleString() + ' \u2013 \u20B9' + p.max_price_qtl.toLocaleString() + ' / Quintal');

        var unitLabel = p.entered_unit === 'quintal' ? 'Quintals' : 'kg';
        setText('totalQtyText', 'For ' + Number(p.entered_quantity).toLocaleString() + ' ' + unitLabel + ' (' + Number(p.qty_kg).toLocaleString() + ' kg total weight)');
        setText('locationText', p.market + ', ' + p.district + ', ' + p.state);
        setText('gradeText',    'Variety: ' + p.variety + ' | Grade: ' + p.grade);
        setText('dateText',     'Official Quote: ' + p.date);
        setText('lossAmount',   Math.round(p.disease_loss_anthracnose).toLocaleString());

        setHTML('diseaseLossMsg',
            'In <strong>' + p.market + '</strong>, healthy <strong>' + p.commodity + ' (' + p.variety + ')</strong> ' +
            'commands <strong>\u20B9' + p.modal_price_kg + '/kg</strong> (\u20B9' + p.modal_price_qtl.toLocaleString() + '/Quintal). ' +
            'If fungal <strong>Anthracnose</strong> or <strong>Leaf Curl Virus</strong> degrades your batch, ' +
            'market value drops ~65%, a direct loss of <strong>\u20B9' + Math.round(p.disease_loss_anthracnose).toLocaleString() + '</strong>.');

        var forecastEl = el('forecastBars');
        if (forecastEl && p.weekly_forecast && p.weekly_forecast.length) {
            var maxVal = Math.max.apply(null, p.weekly_forecast.map(function(w) { return w.price_kg; })) * 1.2 || 1;
            forecastEl.innerHTML = p.weekly_forecast.map(function(item, idx) {
                var h = Math.min(100, Math.max(15, Math.round((item.price_kg / maxVal) * 100)));
                return '<div class="bar-col ' + (idx === 1 ? 'active' : '') + '">' +
                    '<div class="bar-wrapper"><div class="bar-fill" style="height:' + h + '%"></div></div>' +
                    '<span class="bar-val">\u20B9' + item.price_kg.toLocaleString() + '/kg</span>' +
                    '<span class="bar-lbl">' + item.week + '</span></div>';
            }).join('');
        }
    }

    function fetchTableRecords() {
        if (!mandiTableBody) return;
        var commodity = tableCommodity ? tableCommodity.value : '';
        var search    = tableSearch    ? tableSearch.value.trim() : '';
        var url = '/api/market-data/records?limit=' + TABLE_LIMIT + '&offset=' + currentTableOffset;
        if (commodity) url += '&commodity=' + encodeURIComponent(commodity);
        if (search)    url += '&market='    + encodeURIComponent(search);

        mandiTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:1.5rem"><i class="fas fa-spinner fa-spin"></i> Fetching APMC records\u2026</td></tr>';

        fetch(url, { cache: 'no-store' })
            .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
            .then(function(data) {
                if (data.success) {
                    renderTableRows(data.records);
                    totalTableRecords = data.total;
                    updatePaginationUI();
                }
            })
            .catch(function(err) {
                console.warn('Table fetch error:', err);
                if (mandiTableBody) mandiTableBody.innerHTML =
                    '<tr><td colspan="11" style="text-align:center;color:#dc2626;padding:1.5rem">Failed to load Mandi records \u2014 please refresh.</td></tr>';
            });
    }

    function renderTableRows(records) {
        if (!mandiTableBody) return;
        if (!records || records.length === 0) {
            mandiTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:1.5rem;color:#64748b">No APMC records matching criteria.</td></tr>';
            return;
        }
        mandiTableBody.innerHTML = records.map(function(r) {
            return '<tr>' +
                '<td>' + r.date + '</td>' +
                '<td><strong>' + r.state + '</strong></td>' +
                '<td>' + r.district + '</td>' +
                '<td>' + r.market + '</td>' +
                '<td><span class="badge-active">' + r.commodity + '</span></td>' +
                '<td>' + r.variety + '</td>' +
                '<td>' + r.grade + '</td>' +
                '<td>\u20B9' + r.min_price.toLocaleString() + '</td>' +
                '<td>\u20B9' + r.max_price.toLocaleString() + '</td>' +
                '<td><strong>\u20B9' + r.modal_price.toLocaleString() + '</strong></td>' +
                '<td><strong style="color:#16a34a">\u20B9' + r.modal_price_kg.toLocaleString() + '</strong></td>' +
                '</tr>';
        }).join('');
    }

    function updatePaginationUI() {
        var start = totalTableRecords === 0 ? 0 : currentTableOffset + 1;
        var end   = Math.min(currentTableOffset + TABLE_LIMIT, totalTableRecords);
        setText('tablePageInfo', 'Showing ' + start + ' \u2013 ' + end + ' of ' + totalTableRecords.toLocaleString() + ' APMC records');
        if (btnPrev) btnPrev.disabled = currentTableOffset === 0;
        if (btnNext) btnNext.disabled = currentTableOffset + TABLE_LIMIT >= totalTableRecords;
    }

    // Boot: fire meta + first table page in parallel, bypass SW cache
    var metaReq = fetch('/api/market-data/meta', { cache: 'no-store' })
        .then(function(res) { if (!res.ok) throw new Error('meta HTTP ' + res.status); return res.json(); });

    var tableReq = fetch(
        '/api/market-data/records?commodity=Green%20Chilli&limit=' + TABLE_LIMIT + '&offset=0',
        { cache: 'no-store' }
    ).then(function(res) { if (!res.ok) throw new Error('table HTTP ' + res.status); return res.json(); });

    Promise.all([metaReq, tableReq])
        .then(function(results) {
            var metaData  = results[0];
            var tableData = results[1];
            if (metaData.success && metaData.data) {
                marketMeta = metaData.data;
                initializeDropdowns();
            }
            if (tableData.success) {
                tableLoaded = true;
                renderTableRows(tableData.records);
                totalTableRecords = tableData.total;
                updatePaginationUI();
            }
        })
        .catch(function(err) {
            console.error('Init failed, retrying meta alone:', err);
            fetch('/api/market-data/meta', { cache: 'no-store' })
                .then(function(r) { return r.json(); })
                .then(function(d) { if (d.success) { marketMeta = d.data; initializeDropdowns(); } })
                .catch(function() {});
            fetchTableRecords();
        });

})();
