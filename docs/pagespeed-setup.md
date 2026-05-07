# PageSpeed Insights API + SSH key — Installation prod via VNC

⚠️ **Statut SSH au 2026-05-06** : SSH direct depuis ton terminal local **ne fonctionne pas** (`Permission denied (publickey)`). La clé pub n'est pas dans `authorized_keys` du serveur. On passe donc par VNC pour cette session, et on en profite pour ajouter la clé pub afin que SSH refonctionne après.

---

## Prérequis

- [ ] Clé API PageSpeed créée dans Google Cloud Console
  - https://console.cloud.google.com/apis/credentials
  - Restriction API : `PageSpeed Insights API`
  - Restriction application : `Adresses IP` → `91.214.191.103`
- [ ] Accès au Manager Infomaniak (pour la console VNC)
- [ ] Mot de passe utilisateur `deploy-ami` du VPS

---

## Étape 1 — Préparer 2 valeurs en local

### 1.1 — Récupérer ta clé publique SSH

Dans ton terminal Mac :

```bash
ssh-keygen -y -f ~/.ssh/swissalytics_vps
```

Sortie attendue (une seule ligne) :
```
ssh-ed25519 AAAA... swissalytics-vps-dardan
```

**Copie cette ligne entière dans ton presse-papier**. Tu vas la coller dans VNC à l'étape 3.

### 1.2 — Récupérer ta clé PageSpeed

Va sur https://console.cloud.google.com/apis/credentials → clique sur ta clé PageSpeed → bouton **AFFICHER LA CLÉ** → copie la valeur (`AIzaSy...`).

Garde cet onglet ouvert, tu en auras besoin à l'étape 3.

---

## Étape 2 — Ouvrir la console VNC

1. Manager Infomaniak → ton VPS Swissalytics → **Console VNC** (ou "Console graphique")
2. Login : `deploy-ami`
3. Mot de passe : celui que tu as défini lors de la création du VPS

### Astuce : presse-papier dans noVNC

La console Infomaniak utilise noVNC. En haut/sur le côté de la fenêtre, il y a un bouton **"Clipboard"** ou icône presse-papier. Clique dessus → un panneau s'ouvre. Tu y colles le texte depuis ton presse-papier local, puis tu cliques dans le terminal VNC, et le texte se "tape" comme si tu l'écrivais. **Indispensable pour les chaînes longues.**

---

## Étape 3 — Dans le VNC, exécuter ces commandes dans l'ordre

### 3.1 — Ré-autoriser ta clé SSH (pour SSH direct à l'avenir)

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
```

Puis :

```bash
echo "PASTE_SSH_PUBKEY_HERE" >> ~/.ssh/authorized_keys
```

→ Remplace `PASTE_SSH_PUBKEY_HERE` par ta clé pub de l'étape 1.1 (utilise le panneau Clipboard de noVNC).

```bash
chmod 600 ~/.ssh/authorized_keys
tail -1 ~/.ssh/authorized_keys
```

→ La dernière commande doit afficher ta clé `ssh-ed25519 AAAA...` complète.

### 3.2 — Installer la clé PageSpeed

```bash
echo "GOOGLE_PAGESPEED_API_KEY=PASTE_PAGESPEED_HERE" | sudo tee -a /var/www/swissalytics/app/.env.production
```

→ Remplace `PASTE_PAGESPEED_HERE` par ta clé PageSpeed de l'étape 1.2.

### 3.3 — Redémarrer le service

```bash
sudo systemctl restart swissalytics.service
sudo systemctl is-active swissalytics.service
```

→ Doit afficher `active`.

### 3.4 — Vérifier le contenu du fichier .env

```bash
sudo tail -5 /var/www/swissalytics/app/.env.production
```

→ Doit afficher la ligne `GOOGLE_PAGESPEED_API_KEY=AIzaSy...`.

---

## Étape 4 — Tester depuis ton terminal local

**Sans fermer le VNC**, ouvre un terminal Mac.

### 4.1 — Vérifier que SSH refonctionne

```bash
ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103 whoami
```

→ Doit afficher `deploy-ami`. Si oui, ✅ SSH refonctionne pour toujours, plus jamais besoin de VNC pour ce genre de tâche.

### 4.2 — Vérifier que la clé PageSpeed est lue par l'app

```bash
curl -s -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' | grep -o '"isEstimated":[a-z]*'
```

| Sortie | Interprétation |
|---|---|
| `"isEstimated":false` | ✅ Clé lue, Lighthouse en mode officiel |
| `"isEstimated":true`  | ❌ Clé non lue — voir Troubleshooting |

Si **les 2 tests passent** : tu peux fermer le VNC. C'est réglé.

---

## Troubleshooting

### `isEstimated:true` après installation

Vérifier que la clé est bien dans le fichier (depuis SSH si fix 3.1 a marché, sinon depuis VNC) :

```bash
ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103 \
  "sudo grep PAGESPEED /var/www/swissalytics/app/.env.production"
```

Tu dois voir une ligne `GOOGLE_PAGESPEED_API_KEY=AIzaSy...`.

Si oui, le problème vient probablement de :
- **Restriction IP mal configurée** — vérifie dans Google Cloud Console que `91.214.191.103` est bien dans la liste autorisée
- **Quota dépassé** — improbable mais possible
- **Clé invalide/désactivée** — créer une nouvelle clé

### Service `failed` après restart

```bash
ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103 \
  "sudo journalctl -u swissalytics.service -n 50 --no-pager"
```

Cherche les lignes en rouge (errors).

### Tester l'API directement depuis le VPS

```bash
ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103 \
  "source /var/www/swissalytics/app/.env.production && curl -s \"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=\$GOOGLE_PAGESPEED_API_KEY\" | head -c 200"
```

- Si tu vois du JSON `{"captchaResult":...}` ou `{"id":...}` → la clé est OK depuis le VPS.
- Si tu vois `"error":{"code":403...}` → restriction IP mal configurée dans Google Cloud Console.
- Si tu vois `"error":{"code":400...INVALID_ARGUMENT"}` → problème de format de clé.

### SSH refuse encore après 3.1

Vérifier les permissions sur le serveur (depuis VNC) :

```bash
ls -la ~/.ssh/
```

Doit afficher :
```
drwx------  (700)  .ssh
-rw-------  (600)  authorized_keys
```

Si pas bon :
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Puis re-test SSH depuis le Mac.

---

## Notes

- La clé PageSpeed est **gratuite** : 25 000 requêtes/jour
- Restriction IP recommandée — voir `tracker.md` OQ2 pour le contexte
- Si l'IP du VPS change un jour : update la restriction dans Google Cloud Console (pas besoin de re-créer la clé)
- Une fois la clé pub SSH installée (étape 3.1), pour les prochains setups d'env vars en prod, tu pourras utiliser directement la commande SSH du bloc "Procédure SSH (après le fix)" ci-dessous

---

## Annexe — Procédure SSH (utilisable après le fix de l'étape 3.1)

Une fois SSH refonctionnel, pour ajouter d'autres variables d'env à l'avenir :

```bash
SOME_VAR="some_value"

ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103 "
sudo tee -a /var/www/swissalytics/app/.env.production > /dev/null <<EOF

# Some new variable
SOME_VAR=$SOME_VAR
EOF
sudo systemctl restart swissalytics.service
sleep 3
sudo systemctl is-active swissalytics.service
"
```

⚠️ Le `EOF` final doit être à la marge gauche (pas d'espace).

---

# 🔥 COMMANDES À COPIER-COLLER DANS LE VNC (l'essentiel)

**Avant de commencer, garde 2 valeurs ouvertes en local** :

1. Sur ton Mac, lance `ssh-keygen -y -f ~/.ssh/swissalytics_vps` → copie la sortie complète (ligne `ssh-ed25519 AAAA...`).
2. Sur Google Cloud Console, affiche ta clé PageSpeed → copie sa valeur (`AIzaSy...`).

Ouvre la console VNC d'Infomaniak, login `deploy-ami` + ton mdp.

---

## Bloc 1 — Ré-autoriser ta clé SSH

Tape (ou colle via le panneau Clipboard de noVNC) **commande par commande** :

```
mkdir -p ~/.ssh && chmod 700 ~/.ssh
```

```
echo "TA_CLE_SSH_PUB_ICI" >> ~/.ssh/authorized_keys
```

→ Remplace `TA_CLE_SSH_PUB_ICI` par la ligne complète `ssh-ed25519 AAAA...` que tu as copiée.

```
chmod 600 ~/.ssh/authorized_keys
```

## Bloc 2 — Installer la clé PageSpeed

```
echo "GOOGLE_PAGESPEED_API_KEY=TA_CLE_PAGESPEED_ICI" | sudo tee -a /var/www/swissalytics/app/.env.production
```

→ Remplace `TA_CLE_PAGESPEED_ICI` par ta clé `AIzaSy...`.

## Bloc 3 — Redémarrer le service

```
sudo systemctl restart swissalytics.service
```

```
sudo systemctl is-active swissalytics.service
```

→ Tu dois voir `active`. Si c'est le cas : **c'est fini côté VNC**, ferme la fenêtre.

---

## Bloc 4 — Vérifier depuis ton terminal Mac

```
ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103 whoami
```

→ Doit afficher `deploy-ami` (= SSH refonctionne).

```
curl -s -X POST https://swissalytics.com/api/geo-analyze -H "Content-Type: application/json" -d '{"url":"https://example.com"}' | grep -o '"isEstimated":[a-z]*'
```

→ Doit afficher `"isEstimated":false` (= clé PageSpeed lue par l'app).

Si les deux passent : envoie-moi un `OK`, je passe OQ2 en ✅ dans `tracker.md`.

---

# 🩺 DIAGNOSTIC — Si `isEstimated:true` après installation

Une commande à lancer depuis ton Mac qui ouvre SSH, fait 3 vérifs, et quitte. Colle-moi la sortie complète.

```bash
ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103 '
echo "=== 1. Contenu actuel de .env.production (PAGESPEED) ==="
sudo grep -i pagespeed /var/www/swissalytics/app/.env.production || echo "(rien trouvé)"

echo ""
echo "=== 2. Configuration systemd du service ==="
sudo systemctl cat swissalytics.service | grep -E "EnvironmentFile|WorkingDirectory|ExecStart" | head -5

echo ""
echo "=== 3. Env vars vues par le process en cours ==="
sudo cat /proc/$(pgrep -f "next.*start\|node.*server" | head -1)/environ 2>/dev/null | tr "\0" "\n" | grep -iE "pagespeed|node_env" || echo "(rien ou process non trouvé)"
'
```

**Interprétation** :

| Section 1 (.env.production) | Section 3 (process) | Diagnostic |
|---|---|---|
| `(rien trouvé)` | `(rien trouvé)` | T'as oublié de sauver dans nano (`Ctrl+O` + Entrée) |
| Ligne présente | `(rien trouvé)` | Service pas restart, ou systemd lit pas ce fichier (voir section 2) |
| Ligne présente | Ligne présente | Clé OK côté process — problème est l'IP restriction Google Cloud Console |
| Ligne présente avec quotes (`KEY="AIza..."`) | Ligne avec quotes | Retire les quotes — Node.js les inclut littéralement dans la valeur |

Si la section 2 montre `EnvironmentFile=` pointant vers un autre fichier que `.env.production`, faut ajouter la clé là où systemd lit vraiment.

---

# 🟢 Si tu es DÉJÀ connecté en SSH sur le VPS

Si ton prompt affiche `deploy-ami@ov-5190fc:~$`, t'es déjà sur le serveur. **Ne fais pas `ssh ...` depuis là** — la clé n'est pas sur le VPS, elle est sur ton Mac. Tape les commandes **directement** dans ta session ouverte.

Colle ce bloc tel quel dans ta session SSH actuelle :

```bash
echo "=== 1. Contenu actuel de .env.production (PAGESPEED) ==="
sudo grep -i pagespeed /var/www/swissalytics/app/.env.production || echo "(rien trouvé)"

echo ""
echo "=== 2. Configuration systemd du service ==="
sudo systemctl cat swissalytics.service | grep -E "EnvironmentFile|WorkingDirectory|ExecStart" | head -5

echo ""
echo "=== 3. Env vars vues par le process en cours ==="
sudo cat /proc/$(pgrep -f "next.*start\|node.*server" | head -1)/environ 2>/dev/null | tr '\0' '\n' | grep -iE "pagespeed|node_env" || echo "(rien ou process non trouvé)"
```

→ Copie la sortie complète et envoie-la-moi.

## Règle générale

| Tu es où | Préfixe à utiliser |
|---|---|
| Terminal Mac (`dardan@MacBook-Pro-de-Dardan`) | `ssh -i ~/.ssh/swissalytics_vps deploy-ami@91.214.191.103 "<commande>"` |
| Session SSH ouverte (`deploy-ami@ov-5190fc`) | Tape la commande directement, sans `ssh ...` |

---

# 🔧 FIX & TESTS FINAUX (dans la session SSH, prompt `deploy-ami@ov-5190fc`)

## A. Restart le service + vérifier que le process voit la clé

```bash
sudo systemctl restart swissalytics.service
```

```bash
sleep 2 && sudo systemctl is-active swissalytics.service
```

```bash
PID=$(sudo systemctl show swissalytics.service -p MainPID --value)
echo "MainPID: $PID"
sudo cat /proc/$PID/environ | tr '\0' '\n' | grep -i pagespeed
```

→ Doit afficher `GOOGLE_PAGESPEED_API_KEY=AIzaSy...`. Si vide, le service ne charge pas le fichier `.env.production` — voir section 2 du DIAGNOSTIC plus haut pour vérifier `EnvironmentFile=`.

## B. Tester l'API Google directement depuis le VPS

```bash
sudo bash -c 'source /var/www/swissalytics/app/.env.production && curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&strategy=mobile&category=performance&key=$GOOGLE_PAGESPEED_API_KEY" | head -c 300'
```

| Sortie | Diagnostic |
|---|---|
| `{"captchaResult":...` ou JSON normal | ✅ Clé valide depuis le VPS |
| `{"error":{"code":403,..."REQUEST_DENIED"...}` | ❌ IP restriction Google Cloud — le VPS sort par une autre IP que `91.214.191.103` |
| `{"error":{"code":400,..."INVALID_ARGUMENT"...}` | ❌ Format de clé invalide (espaces ou caractères bizarres) |

## C. Test final depuis ton Mac (après `exit` de la session SSH)

```bash
curl -s -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' | grep -o '"isEstimated":[a-z]*'
```

→ Doit afficher `"isEstimated":false`.

---

# 🌐 FIX IPv6 — REQUEST_DENIED malgré IP autorisée

## Le problème

Le VPS Infomaniak a deux IP : IPv4 (`91.214.191.103`) et IPv6 (`2001:1600:13:101::1da8`). Quand Node.js / curl appelle Google, il préfère **IPv6** par défaut (résolution DNS dual-stack). Si la restriction Google n'autorise que l'IPv4, l'appel sort en IPv6 et est rejeté avec :

```
"The originating IP address of the call (2001:1600:13:101::1da8) violates this restriction."
```

## La fix

### Étape 1 — Récupérer l'IPv6 exacte du VPS

Si elle a changé depuis le diagnostic ci-dessus, depuis ta session SSH :

```bash
ip -6 addr show ens3 | grep "inet6 " | grep -v "fe80" | awk '{print $2}' | cut -d/ -f1
```

→ Doit afficher quelque chose comme `2001:1600:13:101::1da8`.

### Étape 2 — Ajouter l'IPv6 dans Google Cloud Console

1. Aller sur https://console.cloud.google.com/apis/credentials
2. Cliquer sur ta clé PageSpeed
3. Section **"Restrictions relatives aux applications"** → **"Adresses IP"**
4. Cliquer **"AJOUTER UN ÉLÉMENT"** et entrer l'IPv6 (ou pour être plus tolérant : le préfixe `/64`)
   - Précis : `2001:1600:13:101::1da8`
   - Plus large (recommandé) : `2001:1600:13:101::/64` ← couvre toute la subnet, survit aux rotations d'adresse
5. Garder l'IPv4 `91.214.191.103` aussi (au cas où le VPS bascule en IPv4)
6. **Enregistrer** en bas

### Étape 3 — Attendre 1 min pour propagation, puis re-tester depuis le VPS

```bash
sudo bash -c 'source /var/www/swissalytics/app/.env.production && curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&strategy=mobile&category=performance&key=$GOOGLE_PAGESPEED_API_KEY" | head -c 200'
```

→ Doit retourner du JSON `{"captchaResult":...` ou similaire (pas d'erreur 403).

### Étape 4 — Test final depuis ton Mac

```bash
curl -s -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' | grep -o '"isEstimated":[a-z]*'
```

→ Doit afficher `"isEstimated":false`. ✅

---

# 🐛 Si `isEstimated:true` persiste après le fix IPv6

Si curl depuis le VPS marche (Étape 3 OK avec du JSON) mais Node.js depuis l'app retourne encore estimation, c'est que le code Node fait une erreur SILENCIEUSE quand il appelle Google. On regarde les logs du service.

## A. Voir les erreurs Lighthouse dans les logs (depuis SSH)

```bash
sudo journalctl -u swissalytics.service -n 200 --no-pager | grep -iE "lighthouse|pagespeed|fetch|abort|timeout" | tail -30
```

Cherche des lignes du type :
- `[Lighthouse] PageSpeed API error, falling back to estimation: ...` → Node a essayé l'API, ça a foiré, message après les `:` te dit pourquoi (timeout, JSON parse, etc.)
- `[Lighthouse] Mode estimation (pas de clé API ou erreur)` → soit la clé est pas vue, soit l'API a foiré

## B. Vérifier que le PROCESS Node voit bien la clé

```bash
PID=$(sudo systemctl show swissalytics.service -p MainPID --value)
echo "MainPID: $PID"
sudo cat /proc/$PID/environ | tr '\0' '\n' | grep PAGESPEED
```

→ Doit afficher la ligne. **Si vide** : le service n'a pas été restart proprement après ton edit nano. Refais :
```bash
sudo systemctl restart swissalytics.service
```
puis re-vérifie.

## C. Voir la réponse complète de l'API (depuis ton Mac)

```bash
curl -sv -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' 2>&1 | tail -50
```

→ Montre le HTTP code + le JSON entier. Si tu vois `"warning":"Scores estimés..."` dans la réponse, ça confirme l'estimation côté Node.

## D. Tester avec une URL différente (cache éventuel)

Si example.com a été testé plein de fois, certains CDNs/proxies cachent. Essaie un domaine random :

```bash
curl -s -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.swissinfo.ch"}' | head -c 500
```

→ Envoie le résultat.

## Causes possibles si tout ce qui précède est OK

- **Node.js fait du IPv4 par défaut** alors que curl fait du IPv6 — improbable mais possible. Si A montre des `connect ETIMEDOUT` ou des `EHOSTUNREACH`, c'est ça.
- **Le timeout de 30s du `/api/geo-analyze`** se déclenche parce que Lighthouse prend 15-25s et un autre analyzer prend du temps aussi (`Promise.all` attend le plus lent). Solution : Phase 8 du tracker (passer à `Promise.allSettled` + timeouts par analyzer).
- **Réponse partielle où Lighthouse a réussi mais n'expose pas isEstimated** (fall-through bizarre).

---

# 🔬 Voir le message d'erreur 403 COMPLET (pas tronqué)

Le `grep` masque le JSON détaillé qui contient la VRAIE raison du 403. Pour l'afficher en entier :

## A1. Trigger un appel frais depuis ton Mac

```bash
curl -s -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.swissinfo.ch"}' > /dev/null
```

## A2. Immédiatement après, depuis SSH, voir l'erreur complète

```bash
sudo journalctl -u swissalytics.service --since "2 minutes ago" --no-pager | grep -A 30 "PageSpeed API error"
```

→ Cherche la clé **`message`** dans le JSON retourné. 3 cas typiques :

| Message Google | Diagnostic |
|---|---|
| `The originating IP address ... violates this restriction` | Restriction IP encore mauvaise (vérifier la propagation Google Cloud, peut prendre 5 min) |
| `API key not valid. Please pass a valid API key` | Clé fausse / typo / mal copiée dans .env.production |
| `Quota exceeded` | Improbable mais possible si quota mal partagé |
| `API ... is not enabled` | API PageSpeed pas activée pour ce projet (voir Google Cloud Console → APIs & Services → Library) |

→ **Colle-moi le bloc de 30 lignes complet** que la commande retourne.

---

# 📋 SI LE GREP "PageSpeed API error" EST VIDE

Soit l'appel a réussi (👍), soit Lighthouse n'a pas tourné du tout (timeout amont). On vérifie en 2 commandes.

## Test direct propre depuis ton Mac

```bash
curl -s -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.swissinfo.ch"}' | grep -oE '"isEstimated":[a-z]*|"warning":"[^"]+"|"performance":[0-9]+'
```

→ 3 cas :
- `"isEstimated":false` + `"performance":XX` → ✅ **Lighthouse marche, on a fini**
- `"isEstimated":true` + `"warning":"Scores estimés..."` → estimation toujours active
- Vide ou erreur → la requête a foiré (timeout, etc.)

## Voir les logs complets de la dernière minute (depuis SSH)

```bash
sudo journalctl -u swissalytics.service --since "1 minute ago" --no-pager | tail -40
```

→ Cherche les lignes `[Lighthouse]`. Trois patterns possibles :
- `[Lighthouse] Démarrage audit ...` puis pas d'erreur → ✅ marche
- `[Lighthouse] PageSpeed API error ...` → encore le 403 (revoir IPv6)
- `[Lighthouse] Mode estimation (pas de clé API ou erreur)` directement → soit la clé est pas vue (Bug B précédent), soit l'appel a thrown sans message clair

→ Colle les 2 sorties.

---

# 🚦 RATE LIMIT — Pourquoi la requête n'arrive PAS à Lighthouse

`/api/geo-analyze` est limité à **10 requêtes par minute par IP** (`cwvRateLimiter` dans le code). Si tu as fait beaucoup de tests curl rapprochés depuis ton Mac, ton IP est probablement bloquée.

## Vérif rapide depuis ton Mac

```bash
curl -is -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.swissinfo.ch"}' | head -10
```

→ Regarde la **première ligne** :
- `HTTP/2 200` → la requête passe, Lighthouse devrait tourner — voir le body pour `isEstimated`
- `HTTP/2 429` → ✅ **C'est ça**, rate limit atteint. Attends **60 secondes** puis réessaie
- `HTTP/2 504` → timeout côté serveur (Lighthouse trop lent + autres analyzers, Promise.all)

## Si 429 confirmé

Attends **1 minute**, puis lance UN seul curl propre :

```bash
sleep 60 && curl -s -X POST https://swissalytics.com/api/geo-analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.swissinfo.ch"}' | grep -oE '"isEstimated":[a-z]*|"performance":[0-9]+'
```

→ Si `isEstimated:false` → ✅ on a fini, c'était bien juste un rate limit qui masquait le vrai état.
