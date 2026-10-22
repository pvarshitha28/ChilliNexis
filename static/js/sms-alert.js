document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('sendSmsBtn');
    const status = document.getElementById('smsStatus');

    if (!btn || !status) return;

    btn.addEventListener('click', async function () {
        const disease = document.getElementById('diseaseName')?.textContent.trim();
        const confidenceText = document.getElementById('confidenceValue')?.textContent.trim();
        const confidence = Number.parseFloat(confidenceText);

        if (!disease || disease === 'Loading...' || !Number.isFinite(confidence)) {
            status.textContent = 'Please analyze a chilli plant first.';
            return;
        }

        const phone = prompt('Enter the recipient’s 10-digit Indian mobile number:');
        if (phone === null) return;

        const cleanPhone = phone.trim();
        if (!/^\d{10}$/.test(cleanPhone)) {
            status.textContent = 'Enter a valid 10-digit mobile number.';
            return;
        }

        if (!confirm('Send one SMS about ' + disease + ' to ' + cleanPhone + '? This uses your SMS credits.')) {
            return;
        }

        btn.disabled = true;
        status.textContent = 'Sending SMS request...';

        try {
            const response = await fetch('/api/send-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number: cleanPhone,
                    disease_name: disease,
                    confidence: confidence
                })
            });

            const result = await response.json();
            status.textContent = result.success
                ? 'Fast2SMS accepted the request; delivery is not yet confirmed.'
                : (result.error || 'SMS request was not accepted.');
        } catch (error) {
            status.textContent = 'Could not contact the server. Check the connection before retrying.';
        } finally {
            btn.disabled = false;
        }
    });
});