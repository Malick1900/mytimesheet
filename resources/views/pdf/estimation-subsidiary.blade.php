<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estimation - {{ $subsidiary->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e40af;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
        }
        .logo span {
            color: #16a34a;
        }
        .document-info {
            text-align: right;
        }
        .document-info h1 {
            font-size: 20px;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .document-info p {
            color: #666;
        }
        .subsidiary-section {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .subsidiary-section h2 {
            font-size: 18px;
            margin-bottom: 10px;
        }
        .subsidiary-info {
            display: flex;
            gap: 40px;
        }
        .subsidiary-info p {
            margin: 5px 0;
            opacity: 0.9;
        }
        .summary-cards {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            flex: 1;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #1e40af;
        }
        .summary-card.green {
            border-left-color: #16a34a;
        }
        .summary-card h3 {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .summary-card p {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
        }
        .summary-card.green p {
            color: #16a34a;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background: #1e40af;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        th:last-child, th:nth-child(3) {
            text-align: right;
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        td:last-child, td:nth-child(3) {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        tr:hover {
            background: #f8fafc;
        }
        .total-row {
            background: #f0fdf4;
            font-weight: bold;
        }
        .total-row td {
            border-bottom: none;
            border-top: 2px solid #16a34a;
        }
        .total-row td:first-child {
            color: #166534;
        }
        .total-row td:last-child {
            font-size: 16px;
            color: #16a34a;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            color: #666;
            font-size: 10px;
        }
        .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 200px;
            text-align: center;
        }
        .signature-box p {
            margin-bottom: 60px;
            font-weight: bold;
            color: #333;
        }
        .signature-line {
            border-top: 1px solid #333;
            padding-top: 5px;
            font-size: 10px;
            color: #666;
        }
        @media print {
            body {
                padding: 20px;
            }
            .no-print {
                display: none;
            }
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1e40af;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }
        .print-button:hover {
            background: #1e3a8a;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ Imprimer / PDF</button>

    <div class="header">
        <div class="logo">
            My<span>Timesheet</span>
        </div>
        <div class="document-info">
            <h1>ESTIMATION FILIALE</h1>
            <p>Date: {{ $date }}</p>
        </div>
    </div>

    <div class="subsidiary-section">
        <h2>🏢 {{ $subsidiary->name }}</h2>
        <div class="subsidiary-info">
            <p><strong>Code:</strong> {{ $subsidiary->code }}</p>
            <p><strong>Employés:</strong> {{ count($data) }}</p>
        </div>
    </div>

    <div class="summary-cards">
        <div class="summary-card">
            <h3>Taux horaire</h3>
            <p>{{ number_format($rate, 0, ',', ' ') }} FCFA/h</p>
        </div>
        <div class="summary-card">
            <h3>Total heures</h3>
            <p>{{ number_format($totalHours, 1) }}h</p>
        </div>
        <div class="summary-card green">
            <h3>Montant total</h3>
            <p>{{ number_format($totalAmount, 0, ',', ' ') }} FCFA</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Employé</th>
                <th>Code</th>
                <th>Heures</th>
                <th>Montant (FCFA)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $item)
            <tr>
                <td>{{ $item['employee_name'] }}</td>
                <td>{{ $item['employee_code'] }}</td>
                <td>{{ number_format($item['hours'], 1) }}h</td>
                <td>{{ number_format($item['amount'], 0, ',', ' ') }}</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td>{{ number_format($totalHours, 1) }}h</td>
                <td>{{ number_format($totalAmount, 0, ',', ' ') }} FCFA</td>
            </tr>
        </tbody>
    </table>

    <div class="signature-section">
        <div class="signature-box">
            <p>Le Responsable Filiale</p>
            <div class="signature-line">Signature</div>
        </div>
        <div class="signature-box">
            <p>La Direction</p>
            <div class="signature-line">Signature</div>
        </div>
    </div>

    <div class="footer">
        <p>Document généré automatiquement par MyTimesheet</p>
        <p>{{ $date }}</p>
    </div>

    <script>
        window.onload = function() {
            // Optionnel: déclencher automatiquement l'impression
            // window.print();
        };
    </script>
</body>
</html>
