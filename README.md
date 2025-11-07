# Konuşarak Öğreniyorum - Duygu Analiz Chatbot Projesi

Bu proje, kullanıcı mesajlarının duygu analizini yapabilen bir chatbot uygulamasıdır. Sistem, Türkçe ve İngilizce metinleri analiz ederek pozitif, negatif veya nötr duygu tespiti yapabilmektedir.

## 📋 İçindekiler

- [Proje Yapısı](#proje-yapısı)
- [Kullanılan AI Araçları](#kullanılan-ai-araçları)
- [Kurulum](#kurulum)
- [Dosya Yapısı ve İşlevleri](#dosya-yapısı-ve-işlevleri)
- [Çalışır Demo Linkleri](#çalışır-demo-linkleri)
- [AI ile Yazılan Bölümler](#ai-ile-yazılan-bölümler)

## 🏗️ Proje Yapısı

Proje üç ana bileşenden oluşmaktadır:

1. **AI Service** (`ai-service/`): Python/FastAPI tabanlı duygu analizi servisi
2. **Backend API** (`backend-app/`): ASP.NET Core 9.0 tabanlı REST API
3. **Web App** (`web-app/`): React tabanlı frontend uygulaması

## 🤖 Kullanılan AI Araçları

### Hugging Face Transformers
- **Türkçe Model**: `savasy/bert-base-turkish-sentiment-cased`
  - Türkçe metinler için özel olarak eğitilmiş BERT tabanlı duygu analizi modeli
  - Negatif, nötr ve pozitif duygu sınıflandırması yapar

- **İngilizce Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
  - İngilizce metinler için Twitter verileri üzerinde eğitilmiş RoBERTa modeli
  - Sosyal medya metinleri için optimize edilmiştir

### AI Kütüphaneleri
- **transformers**: Hugging Face'in transformer model kütüphanesi
- **gradio**: Hızlı arayüz oluşturma ve model demo etme aracı
- **fastapi**: Modern Python web framework'ü

## 📦 Kurulum

### Gereksinimler

- Python 3.8+
- .NET 9.0 SDK
- Node.js 16+ ve npm
- SQLite (backend ile birlikte gelir)

### 1. AI Service Kurulumu

```bash
cd ai-service

# Python bağımlılıklarını yükleyin
pip install fastapi uvicorn gradio transformers torch

# Servisi başlatın
python app.py
```

AI servisi `http://localhost:7860` adresinde çalışacaktır.

**Not**: İlk çalıştırmada modeller Hugging Face'den indirileceği için biraz zaman alabilir.

### 2. Backend API Kurulumu

```bash
cd backend-app

# NuGet paketlerini restore edin
dotnet restore

# Veritabanı migration'larını uygulayın (eğer varsa)
cd ChatApp.API
dotnet ef database update

# Backend'i çalıştırın
dotnet run --project ChatApp.API
```

Backend API `http://localhost:5115` adresinde çalışacaktır.

**Docker ile Çalıştırma:**
```bash
cd backend-app
docker build -t chatapp-backend .
docker run -p 5115:5115 chatapp-backend
```

### 3. Web App Kurulumu

```bash
cd web-app

# Bağımlılıkları yükleyin
npm install

# API URL'ini yapılandırın
# src/services/config.js dosyasında API_URL değerini güncelleyin

# Uygulamayı başlatın
npm start
```

Web uygulaması `http://localhost:3000` adresinde çalışacaktır.

**Production Build:**
```bash
npm run build
# build/ klasöründe statik dosyalar oluşturulur
```

## 📁 Dosya Yapısı ve İşlevleri

### AI Service (`ai-service/`)

#### `app.py`
- **İşlev**: FastAPI ve Gradio ile duygu analizi API'si
- **Ana Fonksiyonlar**:
  - `analyze()`: Metin analizi yapan ana fonksiyon
  - `predict()`: FastAPI POST endpoint'i (`/api/predict`)
  - Gradio arayüzü: `/` path'inde interaktif demo
- **AI Kullanımı**: Hugging Face transformers ile duygu analizi yapar

### Backend API (`backend-app/`)

#### `ChatApp.API/Program.cs`
- **İşlev**: ASP.NET Core uygulamasının başlangıç noktası
- **Yapılandırma**:
  - SQLite veritabanı bağlantısı
  - CORS ayarları (React frontend için)
  - Swagger/OpenAPI dokümantasyonu
  - Port yapılandırması (PORT environment variable)

#### `ChatApp.API/Controllers/MessageController.cs`
- **İşlev**: Mesaj CRUD işlemleri
- **Endpoint'ler**:
  - `POST /api/message`: Yeni mesaj gönderme
  - `GET /api/message`: Tüm mesajları listeleme

#### `ChatApp.API/Controllers/SentimentController.cs`
- **İşlev**: Duygu analizi isteklerini AI servisine yönlendirme
- **Endpoint'ler**:
  - `POST /api/sentiment/analyze`: Metin duygu analizi
- **AI Kullanımı**: FastAPI servisine HTTP isteği gönderir

#### `ChatApp.API/Controllers/UserController.cs`
- **İşlev**: Kullanıcı yönetimi
- **Endpoint'ler**:
  - `POST /api/user/register`: Yeni kullanıcı kaydı
  - `GET /api/user`: Tüm kullanıcıları listeleme

#### `ChatApp.Domain/Entities/User.cs`
- **İşlev**: Kullanıcı entity modeli
- **Özellikler**: Id, Nickname, Messages koleksiyonu

#### `ChatApp.Domain/Entities/Message.cs`
- **İşlev**: Mesaj entity modeli
- **Özellikler**: Id, Text, CreatedAt, UserId, User navigation property

#### `ChatApp.Application/Services/UserService.cs`
- **İşlev**: Kullanıcı iş mantığı
- **Metodlar**: `RegisterAsync()`, `GetAllAsync()`

#### `ChatApp.Application/Services/MessageService.cs`
- **İşlev**: Mesaj iş mantığı
- **Metodlar**: `AddMessageAsync()`, `GetAllAsync()`

#### `ChatApp.Infrastructure/Data/AppDbContext.cs`
- **İşlev**: Entity Framework DbContext
- **Özellikler**: Users ve Messages DbSet'leri, unique nickname constraint

#### `ChatApp.Infrastructure/Repositories/GenericRepository.cs`
- **İşlev**: Generic repository pattern implementasyonu

#### `Dockerfile`
- **İşlev**: Backend için Docker container tanımı
- **Base Image**: mcr.microsoft.com/dotnet/aspnet:9.0

### Web App (`web-app/`)

#### `src/App.js`
- **İşlev**: Ana React uygulama komponenti
- **Özellikler**: React Router ile sayfa yönlendirme (Register, Chatbot)

#### `src/components/Chatbot.js`
- **İşlev**: Ana chatbot arayüzü
- **Özellikler**:
  - Mesaj gönderme ve alma
  - Duygu analizi sonuçlarını gösterme
  - Türkçe/İngilizce dil desteği
  - Material-UI ile modern tasarım
  - Gerçek zamanlı mesaj görüntüleme
- **AI Entegrasyonu**: Backend API üzerinden duygu analizi yapar

#### `src/components/register/RegisterPage.js`
- **İşlev**: Kullanıcı kayıt sayfası
- **Özellikler**: Nickname ile kayıt, hata yönetimi, başarılı kayıt sonrası yönlendirme

#### `src/services/config.js`
- **İşlev**: API URL yapılandırması
- **Not**: Production'da backend URL'ini güncelleyin

#### `package.json`
- **İşlev**: React uygulaması bağımlılıkları
- **Ana Kütüphaneler**: React, Material-UI, React Router

## 🔗 Çalışır Demo Linkleri

### Web Chat (Vercel)
🔗 **https://web-doafozsoe-goktug-kaplans-projects.vercel.app**
- React web uygulamasının canlı versiyonu
- Vercel üzerinde deploy edilmiş production build

### Mobil Uygulama
📱 **React Native mobil build veya APK**
- **Not**: Projede şu anda React Native uygulaması bulunmamaktadır
- Web uygulaması mobil tarayıcılarda responsive olarak çalışmaktadır
- Gelecekte React Native ile mobil uygulama geliştirilebilir

### Hugging Face Space (AI Endpoint)
🤗 **https://agoktugkaplan-sentimentanalysis.hf.space/**
- Duygu analizi modelinin canlı demo versiyonu
- Gradio arayüzü ile interaktif test imkanı
- `ai-service/app.py` dosyası Hugging Face Space'e deploy edilebilir

### Render API URL
🚀 **https://sentimentanalysisbackend-y3q9.onrender.com**
- Backend API'nin production versiyonu
- Render.com üzerinde deploy edilmiş ASP.NET Core API
- WebSocket ve REST endpoint'leri

## 🤖 AI ile Yazılan Bölümler

### AI Service (`ai-service/app.py`)
- ✅ **Tamamı AI ile geliştirilmiştir**
  - Hugging Face transformers entegrasyonu
  - FastAPI endpoint implementasyonu
  - Gradio arayüz entegrasyonu
  - Türkçe ve İngilizce model yönetimi
  - Duygu analizi algoritması

### Backend API
- ✅ **SentimentController.cs**: AI servisi entegrasyonu (AI ile yazıldı)
- ⚠️ **Diğer Controller'lar**: Temel CRUD işlemleri (manuel geliştirildi)
- ⚠️ **Service Katmanı**: İş mantığı (manuel geliştirildi)
- ⚠️ **Domain/Infrastructure**: Veritabanı ve entity modelleri (manuel geliştirildi)

### Web App
- ✅ **Chatbot.js**: 
  - Duygu analizi API entegrasyonu (AI ile yazıldı)
  - UI/UX tasarımı (Material-UI ile AI destekli geliştirildi)
  - Dil değiştirme özelliği (AI ile yazıldı)
- ⚠️ **RegisterPage.js**: Temel form işlemleri (manuel geliştirildi)
- ⚠️ **App.js**: Router yapılandırması (manuel geliştirildi)

### Dockerfile
- ⚠️ **Backend Dockerfile**: Manuel olarak yazılmıştır

## 🚀 Deployment Notları

### AI Service Deployment (Hugging Face Space)
1. Hugging Face hesabı oluşturun
2. Yeni Space oluşturun (Gradio template seçin)
3. `app.py` dosyasını Space'e yükleyin
4. `requirements.txt` dosyası oluşturun:
   ```
   fastapi
   uvicorn
   gradio
   transformers
   torch
   ```

### Backend Deployment (Render)
1. Render.com'da yeni Web Service oluşturun
2. GitHub repository'yi bağlayın
3. Build Command: `dotnet restore && dotnet publish -c Release -o out`
4. Start Command: `cd ChatApp.API && dotnet out/ChatApp.API.dll`
5. Environment Variables: `PORT=5115`

### Web App Deployment (Vercel)
1. Vercel hesabı oluşturun
2. GitHub repository'yi bağlayın
3. Root Directory: `web-app`
4. Build Command: `npm install && npm run build`
5. Output Directory: `build`
6. Environment Variables: Backend API URL'ini ayarlayın

## 📝 Notlar

- Backend API'deki `SentimentController.cs` dosyasında AI servis URL'i (`http://localhost:7860`) production'da güncellenmelidir
- Web app'teki `config.js` dosyasında backend API URL'i production'da güncellenmelidir
- İlk çalıştırmada AI modelleri indirileceği için internet bağlantısı gereklidir
- SQLite veritabanı dosyası (`chatapp.db`) proje içinde bulunmaktadır

## Görseller 
![WhatsApp Image 2025-11-07 at 16 33 15](https://github.com/user-attachments/assets/ff958d84-acc8-4f90-b065-a14aca9256de)
![WhatsApp Image 2025-11-07 at 16 25 53](https://github.com/user-attachments/assets/e6e4baf3-028b-4567-9633-87ce76962735)



