# Calinfco Operations - Local n8n Automation Engine

This folder contains the Docker Compose setup, environment templates, product automation data, and workflow definitions powering Calinfco Water Purifiers backend automations.

---

## Prerequisites

- **Docker Desktop** installed and running on Windows.
- **PowerShell** (built-in on Windows).

---

## Quick Start Guide (Windows PowerShell)

Follow these step-by-step instructions in PowerShell to initialize and run n8n locally.

### Step 1: Navigate to the n8n Directory
Open PowerShell and change to the `automation/n8n` directory:
```powershell
cd "d:\My Projects\E-commerce_water_purifer_app\automation\n8n"
```

---

### Step 2: Generate a Secure Encryption Key
n8n requires a minimum 32-character encryption key (`N8N_ENCRYPTION_KEY`) to encrypt stored credentials in its local database. Run the following command in PowerShell to generate a cryptographic 64-character hex key:

```powershell
$encryptionKey = [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "Generated Key: $encryptionKey"
```

---

### Step 3: Create the Local `.env` File
Create `.env` from `.env.example` and set the generated key:

```powershell
# Copy the template to .env
Copy-Item .env.example .env

# Insert the generated encryption key into .env
(Get-Content .env) -replace 'replace_with_a_secure_random_key_min_32_chars', $encryptionKey | Set-Content .env

# Verify the file was created (never commit this file)
Get-Content .env | Select-String "N8N_ENCRYPTION_KEY"
```

> **Security Note:** `.env` is protected by both `.gitignore` and `automation/n8n/.gitignore`. Never commit actual keys or API credentials to version control.

---

### Step 4: Start n8n Using Docker Compose
Start the n8n container in the background (detached mode):

```powershell
docker compose up -d
```

Expected output:
```text
[+] Running 2/2
 ✔ Network n8n_default       Created
 ✔ Container calinfco-n8n     Started
```

---

### Step 5: Verify the Service is Running
Check the status of the container:

```powershell
docker compose ps
```

To view the live execution logs:

```powershell
docker compose logs -f n8n
```

Look for the log output:
```text
Editor is now accessible via:
http://127.0.0.1:5678/
```
Press `Ctrl + C` to exit the log stream.

---

### Step 6: Access the n8n Web Console
Open your web browser and navigate to:
```text
http://localhost:5678
```
*(Or `http://127.0.0.1:5678`)*

On first access, complete the one-time owner account setup with your local admin email and password.

---

### Step 7: Managing the n8n Service Lifecycle

#### Stop n8n (Preserving All Data & Workflows):
To gracefully stop n8n without losing any workflows, execution history, or credentials, use:
```powershell
docker compose stop
```
*(Or `docker compose down` — note that `docker compose down` stops and removes the container, but leaves the persistent `calinfco_n8n_data` Docker volume completely intact).*

#### Restart / Start n8n Again:
Whenever you wish to resume n8n:
```powershell
docker compose start
# or if down was used:
docker compose up -d
```
All your imported workflows, database entries, and credentials will be preserved.

#### Check Persistent Data Volume:
To verify that your persistent data volume exists:
```powershell
docker volume ls | Select-String "calinfco_n8n_data"
```

---

## Product Social Media Automation

- **Data Template:** `Products-template.csv` contains verified product descriptions, image prompts, captions, and publishing status.
- **Workflow Plan:** See `WORKFLOW_PLAN.md` for complete architecture, node order, and dry-run execution logic.
- **Workflow Files:** Ready-to-import JSON definitions are in `workflows/`.
