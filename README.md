# TubesKCB

Proyek ini adalah sistem yang mengintegrasikan backend Python (FastAPI) dengan AI lokal menggunakan model **Gemma-4-e4b** sebagai otak pemrosesan.

## 🛠️ Panduan Instalasi & Setup

Pastikan Anda telah menginstal Python dan Node.js di perangkat Anda sebelum memulai.

### 1. Persiapan AI Backend (LM Studio)
1. Download dan install [LM Studio](https://lmstudio.ai/).
2. Cari model `google/gemma-4-e4b` di kolom pencarian lalu **Download**.
3. Buka menu **Local Server** (ikon server di sidebar kiri).
4. Pilih model `gemma-4-e4b` di bagian atas.
5. Klik **Start Server** dan biarkan terminal server ini tetap menyala.

### 2. Setup Backend (Python)
Buka terminal dan arahkan ke direktori `backend`:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
Catatan: Jangan tutup terminal backend ini.
3. Setup Frontend (Node.js)
Buka terminal baru di direktori frontend:
Bash
cd frontend
npm install
npm run dev
