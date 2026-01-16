<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notification->title }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .notification-type {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        .type-TASK_SUBMITTED {
            background: #fef3c7;
            color: #92400e;
        }
        .type-TASK_APPROVED {
            background: #d1fae5;
            color: #065f46;
        }
        .type-TASK_REJECTED {
            background: #fee2e2;
            color: #991b1b;
        }
        .message {
            font-size: 16px;
            color: #374151;
            margin: 20px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #1e40af;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background: #1e40af;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 20px;
        }
        .cta-button:hover {
            background: #1e3a8a;
        }
        .footer {
            padding: 20px 30px;
            background: #f9fafb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .footer a {
            color: #1e40af;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MyTimesheet</h1>
            <p>Gestion des heures de travail</p>
        </div>
        
        <div class="content">
            <span class="notification-type type-{{ $notification->type }}">
                @if($notification->type === 'TASK_SUBMITTED')
                    📋 Nouvelle soumission
                @elseif($notification->type === 'TASK_APPROVED')
                    ✅ Heures validées
                @elseif($notification->type === 'TASK_REJECTED')
                    ❌ Heures rejetées
                @else
                    🔔 Notification
                @endif
            </span>
            
            <h2>{{ $notification->title }}</h2>
            
            <div class="message">
                {{ $notification->message }}
            </div>

            @if($notification->data)
                @if(isset($notification->data['total_hours']))
                    <p><strong>Heures totales:</strong> {{ $notification->data['total_hours'] }}h</p>
                @endif
                @if(isset($notification->data['entry_count']))
                    <p><strong>Nombre d'entrées:</strong> {{ $notification->data['entry_count'] }}</p>
                @endif
            @endif
            
            <a href="{{ url('/dashboard') }}" class="cta-button">
                Accéder à MyTimesheet
            </a>
        </div>
        
        <div class="footer">
            <p>
                Cet email a été envoyé automatiquement par MyTimesheet.<br>
                <a href="{{ url('/dashboard') }}">Accéder à la plateforme</a>
            </p>
            <p>© {{ date('Y') }} MyTimesheet. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
