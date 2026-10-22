# ChilliNexis: An Integrated Deep Learning Framework for Chilli Plant Disease Detection and Agricultural Decision Support

**Domain:** Artificial Intelligence, Deep Learning, Machine Learning, Computer Vision, and AgriTech

## 🌶️ Project Overview

ChilliNexis is an integrated agricultural technology framework that applies deep learning and computer vision to chilli plant disease detection. The application enables users to submit chilli leaf images for classification and access supporting disease information through a web-based interface.

The framework combines image-based disease classification, user management, prediction history, analytics, a disease reference guide, and agricultural market-data exploration. It is designed to support technology-assisted crop monitoring and provide a foundation for agricultural decision support.

ChilliNexis brings together artificial intelligence, web development, and agricultural data processing to explore practical applications of intelligent systems in chilli cultivation.

## 📚 Dataset

**Dataset:** [Preprocessed Chilli Disease Dataset — Kaggle](https://www.kaggle.com/datasets/ravindubandara3002/preprocessed-chilli-disease-dataset)

The project uses a trained deep learning model configured to classify chilli leaf images into five categories. Model performance depends on dataset quality, preprocessing, class representation, and the similarity between training images and real-world images.

Large trained model files are not included in this public repository and must be supplied separately in the location expected by the application.

## 🎯 Features

### Core Detection

- **Deep Learning-Based Disease Detection** — Classifies uploaded chilli leaf images using a trained model.
- **Image Upload** — Provides an interface for submitting chilli leaf images for analysis.
- **Camera Capture** — Supports browser-based image capture where enabled by the application.
- **Image Validation** — Supports AI-assisted image validation where the required service and credentials are configured.
- **Five Classification Categories** — Chilli Whitefly, Chilli Yellowish, Chilli Healthy, Chilli Anthracnose, and Chilli Leaf Curl Virus.
- **Prediction Results** — Presents the classification output and associated confidence information where supported by the model and interface.
- **Disease Information** — Provides supporting disease details to help users interpret classification results.

### User System

- **User Authentication** — Registration and login functionality where configured.
- **Session Management** — Supports authenticated user sessions.
- **Prediction History** — Provides access to previous predictions where persistence is enabled.
- **Account Management** — Supports configured user account operations.

### Admin Dashboard

- **Administrative Panel** — Provides access to configured administrative functionality.
- **User Management** — Supports user-related administration where implemented.
- **Prediction Analytics** — Provides access to available prediction statistics.
- **Disease Information Management** — Supports configured disease-data management features.
- **Contact Message Management** — Supports contact submissions where enabled.
- **Notifications** — Provides notification functionality where configured and tested.

### Information Pages

- **Disease Reference Guide** — Provides information about chilli diseases and pests available in the application.
- **Analytics Page** — Presents available detection statistics and visualisations.
- **Contact Page** — Provides a way for users to submit enquiries where configured.
- **About and FAQ Pages** — Offers supporting project information.

### Agricultural Market Data

- **Market-Data Processing** — Loads and queries stored agricultural market records.
- **Commodity Information** — Supports exploration of available market data.
- **Future Market Intelligence** — Provides a foundation for adding verified live market feeds, state-specific comparisons, and price forecasting.

**Note:** The bundled market data is historical. It should not be described as live market pricing or a guaranteed prediction of current market rates.

## 📋 Prerequisites

- Python 3.11 recommended for the development environment.
- Git.
- MongoDB Atlas or a local MongoDB instance, if required by the configured features.
- A compatible trained disease classification model.
- Google Gemini API key, if AI-assisted image validation requires it.
- Additional credentials for any optional external services used by the application.

## 📁 Project Structure

```text
ChilliNexis/
│
├── app.py
├── mongodb_database.py
├── requirements.txt
├── requirements_web.txt
├── class_names.json
├── indian_market_service.py
├── README.md
│
├── data/
│   ├── indian_mandi_market_data.json
│   └── indian_mandi_market_data.csv
│
├── templates/
│   └── ... HTML templates
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── tests/
├── docs/
├── chilli_disease_detection.ipynb
├── Modal training outputs/
└── Other Documents/
```

- `app.py` — Main Flask application.
- `mongodb_database.py` — Database functionality, if used by the current application configuration.
- `requirements.txt` — Python dependencies.
- `requirements_web.txt` — Additional web dependencies.
- `class_names.json` — Configured disease classification labels.
- `indian_market_service.py` — Agricultural market-data processing service.
- `data/` — Bundled market-data files.
- `templates/` — HTML templates for the web interface.
- `static/` — Frontend stylesheets, JavaScript, and images.
- `tests/` — Automated tests.
- `docs/` — Project documentation.
- `chilli_disease_detection.ipynb` — Model development and experimentation notebook.

## 🚀 Installation & Setup

### 1. Clone or Navigate to Project Directory

Clone your own GitHub repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ChilliNexis
```

If the repository is already cloned, navigate to its directory instead.

### 2. Create and Activate Virtual Environment

```bash
python -m venv .venv
```

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**

```cmd
.venv\Scripts\activate.bat
```

**Linux/Mac:**

```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If additional dependencies are required, review `requirements_web.txt` and install them as appropriate:

```bash
pip install -r requirements_web.txt
```

Use compatible versions of TensorFlow, Keras, and related packages.

### 4. Configure Image Validation

If the application uses the Google Gemini API for image validation, configure the required API key in a local `.env` file.

If local image-validation models or other supporting resources are required, follow the setup instructions for the specific implementation present in the repository.

Large model files and optional resources are not included in this public repository unless explicitly added.

### 5. Configure Environment Variables

Create a local `.env` file in the project root and provide the values required by the application.

Example:

```env
SECRET_KEY=replace_with_a_strong_secret_key
MONGODB_URI=mongodb://localhost:27017/
GEMINI_API_KEY=your_api_key_here
```

These are example settings. Confirm the exact variable names and configuration expected by the application. Configure email settings only if email functionality is enabled.

**Security note:** Never upload actual API keys, passwords, database credentials, or other secrets to GitHub.

### 6. Start the Application

Ensure that the required services, environment variables, and trained model are configured.

```bash
python app.py
```

Open the local address printed in the terminal. The default development address is commonly:

`http://127.0.0.1:5000`

The actual address and port depend on the application configuration.

For production deployment, use a suitable production server and configure HTTPS, secrets, database access, and other security requirements.

## 📱 How to Use

1. **Open the Application** — Start the server and visit the local application URL.
2. **Sign In** — Register or log in if authentication is enabled.
3. **Upload an Image** — Select a suitable chilli leaf image or use camera capture if available.
4. **Validate the Image** — Use image validation if the configured service is enabled.
5. **Analyse the Image** — Submit the image for disease classification.
6. **Review Results** — Examine the predicted class, available confidence information, and supporting disease details.
7. **Explore Other Features** — Access prediction history, analytics, disease references, or agricultural market data where available.

Classification results are intended to support preliminary assessment and should not replace expert agricultural diagnosis.

## 🧪 API Endpoints

The application may provide endpoints for health checks, prediction, authentication, disease information, analytics, notifications, and administrative functions.

The precise routes, HTTP methods, authentication requirements, and response formats must be confirmed against the current `app.py` implementation before they are documented as supported API endpoints.

## 📊 Disease Classes (AI Detectable)

The current model configuration contains five classification categories:

1. **Chilli Whitefly** — A category associated with whitefly-related damage.
2. **Chilli Yellowish** — A category associated with yellowing symptoms.
3. **Chilli Healthy** — A category representing healthy chilli leaves.
4. **Chilli Anthracnose** — A category associated with anthracnose symptoms.
5. **Chilli Leaf Curl Virus** — A category associated with leaf curl virus symptoms.

The disease reference guide may include additional diseases and pests beyond these five model classes. Reference-guide entries should not be interpreted as AI-detectable classes unless the trained model explicitly supports them.

## 🛠️ Technology Stack

| Layer                  | Technology                             |
| ---------------------- | -------------------------------------- |
| Backend                | Python, Flask                          |
| Database               | MongoDB, where configured              |
| Deep Learning          | TensorFlow, Keras                      |
| AI-Assisted Validation | Google Gemini API, where configured    |
| Computer Vision        | Image preprocessing and classification |
| Password Security      | bcrypt, where implemented              |
| Frontend               | HTML5, CSS3, JavaScript                |
| Image Processing       | Pillow, NumPy                          |
| Market Data            | Python, CSV, JSON                      |
| Version Control        | Git, GitHub                            |

## 🔐 Security Notes

- Store passwords using an appropriate password-hashing mechanism.
- Keep API keys and database credentials in environment variables.
- Exclude `.env` files, secrets, and local configuration files from version control.
- Validate uploaded images and user input.
- Protect authenticated and administrative routes.
- Use HTTPS and secure session-cookie settings in production.
- Restrict database access to authorised users and services.
- Review third-party dependencies and data licences before deployment or redistribution.

## 🐛 Troubleshooting

| Issue                         | Suggested Action                                                      |
| ----------------------------- | --------------------------------------------------------------------- |
| MongoDB connection failure    | Verify `MONGODB_URI`, database availability, and network permissions. |
| Image-validation failure      | Check the configured validation service, API key, and dependencies.   |
| Model-loading failure         | Confirm that a compatible model file exists at the configured path.   |
| Incorrect class labels        | Check that `class_names.json` matches the model's output order.       |
| Dependency errors             | Use the intended Python version and compatible package versions.      |
| Port already in use           | Configure another available port or stop the process occupying it.    |
| Email or notification failure | Verify the relevant service configuration and credentials.            |

## 📄 License

A project license has not yet been specified. Before publishing or redistributing the project, confirm the licensing requirements for the source code, datasets, pretrained models, and third-party components, then add an appropriate license.

## 🎓 Credits

**ChilliNexis — An Integrated Deep Learning Framework for Chilli Plant Disease Detection and Agricultural Decision Support**

Developed using concepts and technologies from artificial intelligence, deep learning, machine learning, computer vision, web development, and agricultural technology.

Dataset source: [Preprocessed Chilli Disease Dataset — Kaggle](https://www.kaggle.com/datasets/ravindubandara3002/preprocessed-chilli-disease-dataset)

Third-party libraries, models, and datasets should be acknowledged in accordance with their respective licences and attribution requirements.
