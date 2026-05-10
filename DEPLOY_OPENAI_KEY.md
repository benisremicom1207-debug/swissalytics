# Ajout OPENAI_API_KEY en prod (P14)

## 1. SSH sur le VPS

```bash
ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103
```

## 2. Diagnostic — vérifier l'état actuel

Une fois sur le VPS, lance :

```bash
ls -la /var/www/swissalytics/app/.env.production
sudo grep -c "^OPENAI_API_KEY=" /var/www/swissalytics/app/.env.production
sudo systemctl show swissalytics -p ActiveState,SubState,ExecMainStartTimestamp --no-pager
```

Interprétation de la sortie :

| Résultat `grep -c` | Diagnostic |
|---|---|
| `0` | Clé absente → ajouter (étape 3) |
| `1` | Clé présente → restart suffit (étape 4) |
| `>1` | Doublon → nettoyer puis restart |

## 3. Ajouter la clé (si absente)

```bash
sudo nano /var/www/swissalytics/app/.env.production
```

Dans nano :
- Va à la fin du fichier
- Ajoute la ligne : `OPENAI_API_KEY=sk-...` (colle ta vraie clé)
- `Ctrl+O` puis `Enter` (sauvegarder)
- `Ctrl+X` (quitter)

## 4. Restart du service

```bash
sudo systemctl restart swissalytics
sudo systemctl status swissalytics --no-pager | head -15
```

Vérifier que la sortie contient `active (running)`.

## 5. Smoke test depuis le VPS

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
```

Doit afficher `200`.

## 6. Quitter le SSH

```bash
exit
```

## 7. Test end-to-end depuis ton terminal local

```bash
curl -s -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://wingo.ch","pageContext":{"lang":"fr","title":"Wingo — Internet & Mobile","h1":"Internet et mobile"}}' \
  --max-time 60 \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
ks = d.get('keywordSuggestions')
if ks:
    print('LLM OK — model:', ks.get('model'))
    for s in ks.get('suggestions', []):
        print(' •', s.get('keyword'), '→', s.get('rationale')[:80])
else:
    print('keywordSuggestions: MISSING')
"
```

Si tu vois `LLM OK: <keyword>` → P14 tourne.
Si `MISSING` → la clé n'est pas chargée (revérifier étapes 3-4).
