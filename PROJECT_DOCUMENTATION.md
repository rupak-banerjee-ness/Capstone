# CrackSQL - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Root Level Files](#root-level-files)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Configuration Files](#configuration-files)
6. [Data Models](#data-models)
7. [API Endpoints](#api-endpoints)

---

## Project Overview

**CrackSQL** is an AI-powered SQL dialect translation system that enables seamless conversion between different SQL databases (PostgreSQL, MySQL, Oracle). It combines rule-based strategies with Large Language Models (LLMs) for high-accuracy SQL translation.

### Key Features
- **Multi-dialect Support**: PostgreSQL ↔ MySQL ↔ Oracle
- **Hybrid Approach**: Rule-based + LLM-based translation
- **Knowledge Base**: RAG (Retrieval-Augmented Generation) using vector embeddings
- **Web Interface**: Interactive UI built with Vue 3
- **REST API**: FastAPI-based backend with Flask
- **Vector Store**: Chroma for semantic search
- **LLM Integration**: Support for cloud (OpenAI, DeepSeek) and local models

---

## Root Level Files

### 1. `Capstone_Proposal.md`
**Purpose**: Project proposal document describing the capstone assessment objectives.
- Contains business scenario for database migration
- Details 8 key responsibilities (discovery, analysis, conversion, migration, validation, testing, planning, approval)
- Outlines the problem: enterprises struggle with manual database migrations
- Solution: AI-powered assistant for automated SQL translation and validation

### 2. `extract_docx.py`
**Purpose**: Utility script to extract text from DOCX files.
- Uses `python-docx` library to read Word documents
- Iterates through paragraphs and prints text content
- Used for document processing/extraction tasks

### 3. `CrackSQL/`
**Purpose**: Main project directory containing the complete application

---

## Backend Architecture

### Core Application Files

#### `backend/app.py`
**Purpose**: Application entry point for the Flask server.
```python
from app_factory import create_app
app = create_app(config_name="PRODUCTION")
```
- Creates Flask app instance using factory pattern
- Runs development server on `0.0.0.0:30006`
- Initializes application context

#### `backend/app_factory.py`
**Purpose**: Application factory for Flask app creation.
- **Key Functions**:
  - `find_config_file()`: Intelligently locates configuration files from multiple search paths
  - `create_app()`: Creates Flask app with proper configuration, blueprints, and middleware
- **Responsibilities**:
  - Initializes CORS (Cross-Origin Resource Sharing)
  - Sets up database connections via SQLAlchemy
  - Registers API blueprints from `api/router.py`
  - Configures caching layer
  - Initializes APScheduler for background jobs
  - Sets up logging system
  - Applies JSONEncoder for API responses

#### `backend/models.py`
**Purpose**: Database ORM models using SQLAlchemy.
- **Key Classes**:
  - `DatabaseType`: Enum with supported databases (MySQL, PostgreSQL, Oracle)
  - `BaseModel`: Base class with common fields (id, created_at, updated_at)
  - `DatabaseConfig`: Stores database connection configurations
    - Fields: host, port, database, username, password, db_type, description
  - `RewriteStatus`: Enum for translation job status (success, failed, processing)
  - `RewriteHistory`: Tracks SQL translation jobs and their results
  - `KnowledgeBase`: Stores knowledge base information
  - `JSONContent`: Stores JSON-formatted SQL examples for the knowledge base
  - `LLMModel`: Database configuration for LLM models
    - Fields: name, deployment_type (cloud/local), api_base, api_key, temperature, max_tokens, etc.

#### `backend/cracksql.py`
**Purpose**: Main SQL translation logic and model management.
- **Key Functions**:
  - `add_llm_model()`: Adds new LLM model configuration to database
    - Validates required fields based on deployment type (local vs cloud)
    - Creates model entry with parameters
    - Returns success/failure status
  - Imports `Translator` class for SQL dialect conversion
  - Imports `LLMModelService` for model management

#### `backend/translate.py`
**Purpose**: Core SQL translation engine integrating rule-based and LLM-based approaches.
- **Key Components**:
  - `Translator` Class: Main translation orchestrator
    - **Constructor Parameters**:
      - `model_name`: LLM model to use (e.g., 'gpt-3.5-turbo')
      - `src_sql`: Source SQL statement
      - `src_dialect`: Source database type (mysql, postgresql, oracle)
      - `tgt_dialect`: Target database type
      - `tgt_db_config`: Target database connection details
      - `vector_config`: Vector store configuration
      - `retrieval_on`: Enable/disable RAG retrieval
      - `top_k`: Number of retrieved examples
      - `history_id`: Track translation history
      - `out_type`: Output format (file, etc.)
  
  - **Integrated Modules**:
    - `sqlglot`: Rule-based SQL translation library
    - `preprocessor.antlr_parser`: ANTLR-based SQL parsing
    - `preprocessor.query_simplifier`: Query normalization and simplification
    - `translator.llm_translator`: LLM-based SQL translation
    - `vector_store.chroma_store`: Semantic similarity search

#### `backend/init_knowledge_base.py`
**Purpose**: Script to initialize the vector store and knowledge base from SQL documentation.
- **Key Functions**:
  - `parse_args()`: Parses command-line arguments (config file path)
  - `load_config()`: Loads YAML configuration file
  - `initialize_kb()`: Creates knowledge base and indexes SQL documentation
    - Extracts SQL syntax from MySQL, PostgreSQL, Oracle documentation
    - Embeds documentation using sentence transformers
    - Stores embeddings in Chroma vector database
- **Usage**: `python init_knowledge_base.py --config_file config/init_config.yaml`

#### `backend/db_config.py`
**Purpose**: Database connection configuration.
- Establishes SQLAlchemy ORM session
- Configures database URI based on environment
- Provides session management utilities

---

### API Layer (`backend/api/`)

#### `backend/api/router.py`
**Purpose**: Central routing configuration aggregating all API blueprints.
```python
router = [
    database_config_api,  # Database configuration endpoints
    rewrite_api,          # SQL translation endpoints
    knowledge_api,        # Knowledge base endpoints
    llm_model_api         # LLM model management endpoints
]
```

#### `backend/api/database_config.py`
**Purpose**: REST API endpoints for database connection configuration.
- **Endpoints**:
  - `GET /api/database_config/support` - List supported database types
  - `POST /api/database_config/list` - Paginated database config list
  - `POST /api/database_config/detail` - Get single config by ID
  - `POST /api/database_config/add` - Add new database configuration
  - `POST /api/database_config/update` - Update existing configuration
  - `POST /api/database_config/delete` - Delete configuration
  - `GET /api/database_config/types` - Get all database types
- **Service Layer**: Delegates to `api.services.database_config`

#### `backend/api/rewrite.py`
**Purpose**: REST API endpoints for SQL translation (rewrite) operations.
- **Endpoints**:
  - `POST /api/rewrite/list` - Get history of translation jobs (paginated)
  - `POST /api/rewrite/detail` - Get details of a specific translation
  - `GET /api/rewrite/latest` - Fetch most recent translation result
  - `POST /api/rewrite/translate` - Initiate new SQL translation job
  - `POST /api/rewrite/abort` - Cancel translation job
  - `POST /api/rewrite/download` - Download translation results
- **Async Support**: Uses APScheduler for background job tracking
- **Service Layer**: Uses `api.services.rewrite.RewriteService`

#### `backend/api/knowledge.py`
**Purpose**: REST API endpoints for knowledge base management.
- **Endpoints**:
  - `GET /api/knowledge_base/list` - List all knowledge bases
  - `GET /api/knowledge_base/detail` - Get KB details by name
  - `POST /api/knowledge_base/create` - Create new knowledge base
  - `POST /api/knowledge_base/update` - Update KB information
  - `DELETE /api/knowledge_base/delete` - Delete knowledge base
  - `POST /api/knowledge_base/search` - Search KB using semantic similarity
  - `POST /api/knowledge_base/upload` - Upload JSON knowledge files
  - `POST /api/knowledge_base/import` - Import KB items
  - `POST /api/knowledge_base/delete_items` - Remove KB items
  - `GET /api/knowledge_base/items` - List KB items
- **Task Queue**: Async import via `task.task.process_json_data`

#### `backend/api/llm_model.py`
**Purpose**: REST API endpoints for LLM model management.
- **Endpoints** (presumed based on project structure):
  - Model list/detail/add/update/delete endpoints
  - Model validation endpoints
  - Model availability check

#### `backend/api/file.py`
**Purpose**: File upload and management endpoints.
- Handles SQL file uploads
- Manages knowledge base JSON files
- File validation and storage

---

### LLM Integration (`backend/llm_model/`)

#### `backend/llm_model/base.py`
**Purpose**: Abstract base class for all LLM implementations.
- Defines common interface for LLM operations
- Methods for:
  - Chat completion
  - Embedding generation
  - Configuration validation
  - Model initialization

#### `backend/llm_model/implementations.py`
**Purpose**: Concrete LLM implementations.
- **CloudLLM**: For cloud-based models (OpenAI, DeepSeek, etc.)
  - Uses API keys and endpoints
  - Manages API rate limiting and retries
  - Supports temperature and max_tokens parameters
- **LocalLLM**: For locally-deployed models
  - Loads models from Hugging Face or local paths
  - Manages GPU/CPU resources
  - Direct inference without API calls

#### `backend/llm_model/llm_manager.py`
**Purpose**: Central manager for loading and caching LLM models.
- **Key Features**:
  - `load_model()`: Loads model based on deployment type
  - `get_model_config_from_db()`: Retrieves model config from database
  - Validates model configurations
  - Caches loaded models to avoid reloading
  - Error handling for invalid configurations

#### `backend/llm_model/embeddings.py`
**Purpose**: Text embedding generation for semantic search.
- Generates vector embeddings using sentence-transformers
- Supports multiple embedding models:
  - All-MiniLM-L6-v2 (384-dim embeddings)
  - Fine-tuned embedding models for domain-specific tasks
- Used by knowledge base for semantic similarity search

#### `backend/llm_model/chat.py`
**Purpose**: Chat-based interaction with LLMs.
- Manages conversation history
- Formats messages for LLM consumption
- Handles streaming responses (if supported)

#### `backend/llm_model/llm_service.py`
**Purpose**: High-level LLM service layer.
- Orchestrates LLM operations
- Handles prompt templates and formatting
- Manages retries and error recovery
- Supports both chat and completion modes

---

### Preprocessing Engine (`backend/preprocessor/`)

#### `backend/preprocessor/antlr_parser/`
**Purpose**: SQL parsing using ANTLR (Another Tool for Language Recognition).
- **Key File**: `parse_tree.py`
  - Uses ANTLR grammar files from `data/antlr_gram/`
  - Parses SQL into abstract syntax tree (AST)
  - Supports MySQL, PostgreSQL, Oracle grammars
  - Extracts query structure and components

#### `backend/preprocessor/query_simplifier/`
**Purpose**: Simplifies and normalizes SQL queries for translation.
- **Key Modules**:
  - `Tree.py`: AST tree node manipulation
    - `TreeNode`: Represents SQL query components
    - `lift_node()`: Restructures tree nodes
  - `locate.py`: Locates specific query components
    - `locate_node_piece()`: Finds nodes by criteria
    - `get_func_name()`: Extracts function names
  - `normalize.py`: Normalizes query syntax for consistency
  - `rewrite.py`: Rewrites query components
    - `get_all_piece()`: Extracts all query pieces for analysis

#### `backend/preprocessor/TreeParser/`
**Purpose**: Custom tree parsing for non-standard SQL structures.

---

### Translation Layer (`backend/translator/`)

#### `backend/translator/llm_translator.py`
**Purpose**: LLM-based SQL translation core logic.
- **Key Class**: `LLMTranslator`
  - Manages multi-turn translation conversations
  - Applies prompt engineering techniques
  - Handles translation failures and retries
  - Validates translated SQL
  - Supports iterative refinement via feedback

#### `backend/translator/translate_prompt.py`
**Purpose**: Prompt templates for SQL translation.
- **Templates**:
  - `SYSTEM_PROMPT_NA`: System prompt for native SQL translation
  - `USER_PROMPT_NA`: User prompt for native SQL translation
  - `SYSTEM_PROMPT_SEG`: Segment-based translation prompts
  - `USER_PROMPT_SEG`: Segment prompts for complex queries
  - `SYSTEM_PROMPT_RET`: Retrieval-enhanced translation prompts
  - `USER_PROMPT_RET`: User prompts with retrieved examples
  - `EXAMPLE_PROMPT`: Few-shot examples for few-shot learning
  - `JUDGE_INFO_PROMPT`: Validation prompts for translation quality

#### `backend/translator/judge_prompt.py`
**Purpose**: Prompt templates for validating translation quality.
- **Templates**:
  - `SYSTEM_PROMPT_JUDGE`: System prompt for validation
  - `USER_PROMPT_JUDGE`: User prompt for translation assessment
  - `USER_PROMPT_REFLECT`: Reflection prompt for refinement
- Validates:
  - SQL syntax correctness
  - Semantic equivalence
  - Data type compatibility
  - Performance implications

---

### Utilities (`backend/utils/`)

#### `backend/utils/constants.py`
**Purpose**: Application-wide constants.
- `TOP_K`: Number of retrieved examples (default: 1)
- `CHUNK_SIZE`: Text chunk size for embeddings (250 tokens)
- `RETRIEVAL_ON`: Enable/disable RAG (default: True)
- `MAX_RETRY_TIME`: Retry attempts for failed translations (2)
- `DIALECT_LIST`: Supported dialects: ["pg", "mysql", "oracle"]
- `DIALECT_LIST_RULE`: Rule-based translation supports 24+ dialects
- `DIALECT_MAP`: Dialect version mappings
  - 'pg': PostgreSQL 14.7
  - 'mysql': MySQL 8.4
  - 'oracle': Oracle 11g
- Regex patterns for parsing LLM responses

#### `backend/utils/public.py`
**Purpose**: Public utility functions.
- YAML file reading
- Configuration parsing
- General helper functions

#### `backend/utils/tools.py`
**Purpose**: Tool functions for translation pipeline.
- `process_err_msg()`: Error message formatting
- `process_history_text()`: History text normalization
- SQL validation utilities
- Response parsing helpers

#### `backend/utils/db_connector.py`
**Purpose**: Database connection and query execution.
- Connects to multiple database types (MySQL, PostgreSQL, Oracle)
- Executes queries safely
- Handles connection pooling
- Error handling for database operations

---

### Vector Store (`backend/vector_store/`)

#### `backend/vector_store/chroma_store.py`
**Purpose**: Chroma vector database integration.
- **Key Class**: `ChromaStore`
  - Manages vector embeddings storage
  - Supports semantic similarity search
  - Creates/updates/deletes collections
  - Retrieves relevant SQL examples based on query similarity
- **Collections**:
  - MySQL 8.0 examples
  - PostgreSQL 14.7 examples
  - Oracle 11g examples

---

### Task Queue (`backend/task/`)

#### `backend/task/task.py`
**Purpose**: Background task processing.
- **Key Functions**:
  - `process_json_data()`: Async import of knowledge base JSON files
  - `process_translation_task()`: Background SQL translation
  - Task status tracking and updates
  - Error logging and recovery

---

### Configuration (`backend/config/`)

#### `backend/config/config.yaml`
**Purpose**: Main application configuration.
- Database connection strings
- API keys for LLM services
- Vector store configuration
- Logging levels
- Cache settings

#### `backend/config/init_config.yaml`
**Purpose**: Knowledge base initialization configuration.
- Paths to SQL documentation files
- Embedding model settings
- Vector store location
- Collection names for each dialect

#### `backend/config/logging_config.py`
**Purpose**: Logging configuration setup.
- Sets up Python logging system
- Configures log levels (DEBUG, INFO, WARNING, ERROR)
- Log file paths and rotation
- Log message formatting

#### `backend/config/logging.yaml`
**Purpose**: YAML logging configuration.
- Logger definitions for different modules
- Handler configuration (console, file)
- Formatter specifications

#### `backend/config/db_config.py`
**Purpose**: Database configuration.
- SQLAlchemy ORM setup
- Session management
- Database URI construction
- Connection pooling parameters

#### `backend/config/cache.py`
**Purpose**: Caching layer configuration.
- Redis or in-memory cache setup
- Cache key patterns
- TTL (time-to-live) settings

#### `backend/config/cracksql_gunicorn.conf`
**Purpose**: Gunicorn WSGI server configuration for production.
- Worker processes
- Binding address and port
- Timeout settings
- Access/error logging

---

## Frontend Architecture

### Core Files (`webui/src/`)

#### `webui/src/main.js`
**Purpose**: Vue 3 application entry point.
- **Initialization Steps**:
  1. Creates Vue 3 app instance
  2. Initializes Pinia store for state management
  3. Sets up persistence plugin for Pinia
  4. Configures Element Plus UI library
  5. Sets up i18n for internationalization (English/Chinese)
  6. Imports global styles and CSS
  7. Registers SVG icon component
  8. Sets up router with permission guards
  9. Configures Vue Flow for workflow visualization
- **Plugins**: Element Plus, Pinia, i18n, Vue Router
- **Styling**: SCSS, UnoCSS, Element Plus CSS

#### `webui/src/App.vue`
**Purpose**: Root Vue component.
- **Functions**:
  - Provides Element Plus theme and locale configuration
  - Sets theme colors based on user preferences
  - Manages global language switching
  - Initializes error logging system
  - Renders router views
- **Lifecycle**:
  - `onBeforeMount`: Sets temporary token if login disabled
  - `onMounted`: Launches error log collection, applies theme

#### `webui/src/permission.js`
**Purpose**: Route permission guards and authentication.
- Validates user access to routes
- Checks authentication tokens
- Redirects to login if unauthorized
- Handles route metadata permissions

#### `webui/src/settings.js`
**Purpose**: Application global settings.
- Default theme colors
- Language settings
- UI component sizing
- Feature flags

#### `webui/src/mock-prod-server.js`
**Purpose**: Mock API server for development/testing.
- Intercepts API calls in development mode
- Returns mock responses
- Simulates backend behavior without running server
- Enables frontend development independence

---

### API Layer (`webui/src/api/`)

#### `webui/src/api/database.js`
**Purpose**: API client for database configuration management.
- **Methods**:
  - `listDatabases()`: Fetch configured databases
  - `getDatabase(id)`: Get single database config
  - `createDatabase(config)`: Add new database
  - `updateDatabase(id, config)`: Modify database config
  - `deleteDatabase(id)`: Remove database config
  - `getSupportedTypes()`: List MySQL, PostgreSQL, Oracle

#### `webui/src/api/rewrite.js`
**Purpose**: API client for SQL translation operations.
- **Methods**:
  - `listRewriteHistory()`: Fetch translation job history
  - `getRewriteDetail(id)`: Get translation result details
  - `startTranslation(sql, source, target)`: Submit new translation job
  - `abortTranslation(id)`: Cancel in-progress translation
  - `downloadResults(id)`: Export translation results

#### `webui/src/api/knowledge.js`
**Purpose**: API client for knowledge base management.
- **Methods**:
  - `listKnowledgeBases()`: Fetch all KBs
  - `getKnowledgeBase(name)`: Get KB details
  - `createKnowledgeBase(config)`: Create new KB
  - `updateKnowledgeBase(name, config)`: Modify KB
  - `deleteKnowledgeBase(name)`: Delete KB
  - `searchKnowledgeBase(query)`: Semantic search in KB
  - `uploadJSON(file)`: Upload JSON knowledge file
  - `importItems(kbName, items)`: Add items to KB

#### `webui/src/api/models.js`
**Purpose**: API client for LLM model management.
- **Methods**:
  - `listModels()`: Fetch available LLM models
  - `getModel(name)`: Get model details
  - `addModel(config)`: Register new LLM model
  - `updateModel(name, config)`: Modify model config
  - `deleteModel(name)`: Unregister model
  - `testModel(name)`: Validate model connection

#### `webui/src/api/user.js`
**Purpose**: API client for user authentication.
- **Methods**:
  - `login(username, password)`: Authenticate user
  - `logout()`: Clear session
  - `getCurrentUser()`: Fetch logged-in user info
  - `getPermissions()`: Fetch user permissions

---

### State Management (`webui/src/store/`)

#### Pinia Store Structure
- **basic.ts**: User authentication and session state
- **config.ts**: Application configuration (theme, language, size)
- Centralized state management for:
  - Current user info
  - Authentication tokens
  - UI preferences
  - Feature flags
- Persistence plugin saves state to localStorage

---

### Components (`webui/src/components/`)

#### Navigation Components
- **Header**: Top navigation bar with user menu, language switcher
- **Sidebar**: Left navigation menu with route links
- **Breadcrumb**: Navigation breadcrumb trail

#### Feature Components
- **DatabaseManager**: Create/edit database configurations
- **TranslationEditor**: SQL input and output editor
- **KnowledgeBaseViewer**: Browse and manage knowledge base
- **ModelManager**: Configure and test LLM models
- **HistoryViewer**: Browse translation history

#### Reusable Components
- **FormComponents**: Input fields, selectors, date pickers
- **DataTable**: Paginated table for lists
- **LoadingSpinner**: Async operation indicators
- **Dialog/Modal**: Confirmation and input dialogs
- **NotificationCenter**: Toast notifications for user feedback

---

### Views (`webui/src/views/`)

#### Major Screens
- **Home**: Dashboard with quick stats and shortcuts
- **DatabaseConfig**: Manage database connections
- **Translator**: Main SQL translation interface
  - Source SQL input area
  - Target dialect selector
  - Translation result display
  - Translation history sidebar
- **KnowledgeBase**: Knowledge base management interface
- **Models**: LLM model configuration page
- **Settings**: User preferences and system settings
- **Admin**: Administrative tools (if applicable)

---

### Routing (`webui/src/router/`)

#### Route Configuration
- Hierarchical route structure
- Protected routes with permission checks
- Lazy-loaded components for code splitting
- Route metadata for:
  - Page titles
  - Required permissions
  - Breadcrumb titles
- Nested routes for complex UI layouts

---

### Utilities (`webui/src/utils/`)

#### Common Utilities
- **http.js**: Axios HTTP client with interceptors
  - Error handling
  - Token refresh logic
  - Request/response logging
- **string.js**: String manipulation helpers
- **array.js**: Array operation utilities
- **date.js**: Date formatting and parsing
- **storage.js**: LocalStorage wrapper
- **validator.js**: Form validation helpers

---

### Styling (`webui/src/styles/` & `webui/src/theme/`)

#### Theme System
- **theme/index.scss**: Theme variables and overrides
- **theme/utils.ts**: Theme switching logic
- **styles/index.scss**: Global styles
- **styles/variables.scss**: Design system colors, spacing, typography
- CSS variables for:
  - Colors (primary, success, warning, error, info)
  - Spacing (padding, margin units)
  - Typography (font families, sizes)
  - Shadows and borders
- Dark/Light theme support

---

### Internationalization (`webui/src/lang/`)

#### i18n Configuration
- **zh.json**: Chinese (Simplified) translations
- **en.json**: English translations
- Language switching without page reload
- Dynamic text translation in components
- Supported translations for:
  - Menu items and navigation
  - Form labels and placeholders
  - Error messages
  - Tooltips and help text

---

## Configuration Files

### `backend/setup.py`
**Purpose**: Python package configuration for PyPI distribution.
- **Dependencies**:
  - **Flask Framework**: Flask, Flask-CORS, Flask-SQLAlchemy, Flask-Migrate
  - **Database Drivers**: PyMySQL, psycopg2, oracledb
  - **LLM Integration**: langchain, openai, sentence-transformers
  - **SQL Processing**: sqlglot, antlr4
  - **Vector Database**: chromadb
  - **ML Libraries**: numpy, scikit-learn, transformers
  - **Utilities**: PyYAML, PyJWT, aiohttp, tenacity

### `backend/requirements.txt`
**Purpose**: Pip dependency specification for development.
- Same dependencies as setup.py for development environment

### `webui/package.json`
**Purpose**: Node.js package configuration.
- **Dependencies**:
  - Vue 3: Core framework
  - Element Plus: UI component library
  - Pinia: State management
  - Vue Router: Client-side routing
  - Axios: HTTP client
  - TypeScript: Type safety
- **Dev Dependencies**:
  - Vite: Build tool
  - Vitest: Unit testing
  - ESLint: Code linting
  - SASS: Stylesheet preprocessing

### `webui/vite.config.js`
**Purpose**: Vite build configuration.
- Code splitting and optimization
- Dev server configuration
- Asset processing
- Environment variable handling
- Plugin configuration (Vue, TypeScript)

### `webui/tsconfig.json`
**Purpose**: TypeScript compiler configuration.
- ES module compilation target
- Path aliases (@/ for src/)
- Strict type checking
- Vue 3 support

### `webui/pnpm-workspace.yaml`
**Purpose**: pnpm monorepo workspace configuration.
- Defines workspace packages (if using monorepo structure)

---

## Data Models

### Database Schema Overview

```
┌─────────────────────────┐
│   DatabaseConfig        │
├─────────────────────────┤
│ id (PK)                 │
│ host                    │
│ port                    │
│ database                │
│ username                │
│ password                │
│ db_type (MySQL/PG/Oracle)
│ description             │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌─────────────────────────┐
│   RewriteHistory        │
├─────────────────────────┤
│ id (PK)                 │
│ src_sql                 │
│ tgt_sql                 │
│ src_dialect             │
│ tgt_dialect             │
│ status (success/fail)   │
│ error_message           │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌─────────────────────────┐
│   KnowledgeBase         │
├─────────────────────────┤
│ id (PK)                 │
│ name                    │
│ description             │
│ dialect                 │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌─────────────────────────┐
│   JSONContent           │
├─────────────────────────┤
│ id (PK)                 │
│ kb_id (FK)              │
│ content (JSON)          │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌─────────────────────────┐
│   LLMModel              │
├─────────────────────────┤
│ id (PK)                 │
│ name                    │
│ deployment_type         │
│ (cloud/local)           │
│ path / api_base         │
│ api_key                 │
│ temperature             │
│ max_tokens              │
│ is_active               │
│ created_at              │
│ updated_at              │
└─────────────────────────┘
```

---

## API Endpoints Summary

### Database Configuration API
```
GET    /api/database_config/support         - Get supported types
POST   /api/database_config/list            - List configurations
POST   /api/database_config/detail          - Get single config
POST   /api/database_config/add             - Create config
POST   /api/database_config/update          - Update config
POST   /api/database_config/delete          - Delete config
GET    /api/database_config/types           - Get type options
```

### SQL Translation (Rewrite) API
```
POST   /api/rewrite/list                    - List translation history
POST   /api/rewrite/detail                  - Get translation details
GET    /api/rewrite/latest                  - Get latest result
POST   /api/rewrite/translate               - Start new translation
POST   /api/rewrite/abort                   - Cancel translation
POST   /api/rewrite/download                - Export results
```

### Knowledge Base API
```
GET    /api/knowledge_base/list             - List KBs
GET    /api/knowledge_base/detail           - Get KB details
POST   /api/knowledge_base/create           - Create KB
POST   /api/knowledge_base/update           - Update KB
DELETE /api/knowledge_base/delete           - Delete KB
POST   /api/knowledge_base/search           - Semantic search
POST   /api/knowledge_base/upload           - Upload JSON file
POST   /api/knowledge_base/import           - Import items
POST   /api/knowledge_base/delete_items     - Remove items
GET    /api/knowledge_base/items            - List items
```

### LLM Model API
```
GET    /api/llm_model/list                  - List models
GET    /api/llm_model/detail                - Get model details
POST   /api/llm_model/add                   - Add model
POST   /api/llm_model/update                - Update model
POST   /api/llm_model/delete                - Delete model
POST   /api/llm_model/test                  - Test connection
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Web Browser (Vue 3 UI)                      │
│  ┌────────────┬──────────────┬──────────────┬──────────────┐   │
│  │ Translator │ KnowledgeBase│  Database    │   Models     │   │
│  │   View     │    Manager   │   Config     │  Manager     │   │
│  └────────────┴──────────────┴──────────────┴──────────────┘   │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ HTTP/REST API
┌──────────────────────────────────┴──────────────────────────────┐
│                      Flask REST API Server                       │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │  Database    │   Rewrite    │  Knowledge   │   LLM Model  │  │
│  │   Config API │     API      │   Base API   │     API      │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
    ┌───▼─────┐          ┌────────▼─────────┐       ┌────────▼────────┐
    │ Database │          │  Translation     │       │  Vector Store   │
    │ Models   │          │  Pipeline        │       │  (Chroma)       │
    │(SQLAlch) │          │                  │       │                 │
    └──────────┘          │ ┌──────────────┐ │       │ ┌─────────────┐ │
                          │ │Preprocessor  │ │       │ │ Embeddings  │ │
                          │ │(ANTLR, Tree) │ │       │ │ Vector DB   │ │
                          │ └──────────────┘ │       │ └─────────────┘ │
                          │                  │       │                 │
                          │ ┌──────────────┐ │       │ ┌─────────────┐ │
                          │ │  LLM Manager │ │       │ │SQL Examples │ │
                          │ │  + Translator│ │       │ │ & Docs      │ │
                          │ └──────────────┘ │       │ └─────────────┘ │
                          │                  │       │                 │
                          │ ┌──────────────┐ │       └─────────────────┘
                          │ │Rule-based    │ │
                          │ │Translation   │ │
                          │ │(SQLGlot)     │ │
                          │ └──────────────┘ │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            ┌───────▼──────┐          ┌──────────▼──────┐
            │ Cloud LLMs   │          │ Local LLMs      │
            │ - GPT-4      │          │ - Hugging Face  │
            │ - DeepSeek   │          │ - Custom Models │
            └──────────────┘          └─────────────────┘
```

---

## Data Flow: SQL Translation Process

```
1. USER INPUT
   └─> SQL Query, Source Dialect, Target Dialect

2. API ENDPOINT (/api/rewrite/translate)
   └─> Create RewriteHistory record
   └─> Submit background task

3. PREPROCESSING STAGE
   └─> ANTLR Parser: Parse SQL to AST
   └─> Query Simplifier: Normalize and simplify
   └─> Extract key components

4. RETRIEVAL-AUGMENTED GENERATION (RAG)
   └─> Generate query embedding
   └─> Search Chroma vector store
   └─> Retrieve top-k similar SQL examples

5. RULE-BASED TRANSLATION
   └─> Apply SQLGlot transformation rules
   └─> Handle dialect-specific syntax
   └─> Attempt translation

6. LLM-BASED TRANSLATION (if rule-based fails/needs refinement)
   └─> Load LLM model (Cloud or Local)
   └─> Prepare prompt with:
       - System prompt
       - Source SQL
       - Target dialect
       - Retrieved examples
   └─> Call LLM for translation
   └─> Parse LLM response
   └─> Retry on failure (max retries: 2)

7. VALIDATION STAGE
   └─> Judge LLM validates translated SQL
   └─> Check syntax correctness
   └─> Verify semantic equivalence
   └─> Rate confidence

8. DATABASE VALIDATION (optional)
   └─> Connect to target database
   └─> Execute translated SQL
   └─> Verify result set structure

9. RESULT STORAGE
   └─> Update RewriteHistory with results
   └─> Store status, translated SQL, errors
   └─> Cache results

10. FRONTEND NOTIFICATION
    └─> WebSocket or polling updates UI
    └─> Display results to user
```

---

## File Purpose Summary Table

| File/Directory | Purpose | Language |
|---|---|---|
| app.py | Flask app entry point | Python |
| app_factory.py | App factory and middleware setup | Python |
| models.py | SQLAlchemy ORM database models | Python |
| cracksql.py | Core translation logic | Python |
| translate.py | SQL translation orchestration | Python |
| init_knowledge_base.py | KB initialization script | Python |
| api/router.py | API blueprint aggregation | Python |
| api/database_config.py | Database config endpoints | Python |
| api/rewrite.py | Translation endpoints | Python |
| api/knowledge.py | Knowledge base endpoints | Python |
| llm_model/*.py | LLM integration and management | Python |
| preprocessor/*.py | SQL parsing and normalization | Python |
| translator/*.py | LLM prompt templates | Python |
| utils/*.py | Utility functions and constants | Python |
| vector_store/*.py | Vector database integration | Python |
| config/*.py | Configuration management | Python |
| main.js | Vue 3 app initialization | TypeScript |
| App.vue | Root component | Vue 3 |
| api/*.js | API client modules | TypeScript |
| router/*.js | Vue Router configuration | TypeScript |
| store/*.ts | Pinia state management | TypeScript |
| components/*.vue | Reusable Vue components | Vue 3 |
| views/*.vue | Full-page Vue views | Vue 3 |
| setup.py | Package metadata and dependencies | Python |
| vite.config.js | Build tool configuration | JavaScript |
| tsconfig.json | TypeScript compiler options | JSON |
| package.json | Node.js project metadata | JSON |

---

## Key Technologies

### Backend Stack
- **Framework**: Flask 2.2.5 with Flask extensions
- **ORM**: SQLAlchemy 3.0.2
- **Databases**: PostgreSQL, MySQL, Oracle
- **LLM**: OpenAI, LangChain, Sentence Transformers
- **Vector DB**: Chroma 0.4.15
- **SQL Parsing**: SQLGlot 26.6.0, ANTLR 4.13.2
- **Async**: APScheduler, asyncio, aiohttp
- **Deployment**: Gunicorn WSGI server

### Frontend Stack
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Pinia
- **UI Library**: Element Plus
- **Styling**: SCSS, UnoCSS
- **HTTP Client**: Axios
- **i18n**: Vue i18n
- **Type Safety**: TypeScript
- **Testing**: Vitest

### Infrastructure
- **Container**: Docker (optional)
- **Database Migrations**: Alembic
- **Caching**: Flask-Caching
- **Logging**: Python logging

---

## Deployment & Execution

### Backend Startup
```bash
# Development
python app.py

# Production with Gunicorn
gunicorn -c config/cracksql_gunicorn.conf wsgi_gunicorn:app

# Initialize knowledge base
python init_knowledge_base.py --config_file config/init_config.yaml
```

### Frontend Startup
```bash
# Development server
npm run dev  # or pnpm dev

# Production build
npm run build  # or pnpm build
```

---

## Summary

CrackSQL is a comprehensive SQL dialect translation system with:
- **Robust Backend**: Flask/Python with multi-database support
- **Intelligent Translation**: Rule-based + LLM-based hybrid approach
- **Knowledge Enhancement**: RAG using vector embeddings
- **Modern Frontend**: Vue 3 with Element Plus UI
- **Enterprise Features**: Job history, model management, knowledge base
- **Scalable Architecture**: Microservices-ready with async task processing

Each component is carefully designed to handle different aspects of the SQL translation pipeline, from preprocessing and parsing to LLM inference and result validation.
