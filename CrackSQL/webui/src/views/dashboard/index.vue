<template>
  <div class="dashboard-container">
    <!-- top title area -->
    <div class="header-section">
      <div class="header-content">
        <div class="title-area" id="welcome">
          <h1>{{ $t('dashboard.title') }}</h1>
          <p>{{ $t('dashboard.subtitle') }}</p>
        </div>
      </div>
    </div>

    <!-- main operation area -->
    <div class="main-section">
      <!-- left-side feature intro changed to case studies -->
      <div class="features-panel">
        <div class="feature-card">
          <el-icon class="feature-icon">
            <Document/>
          </el-icon>
          <h3>PostgreSQL Translate to MySQL</h3>
          <div class="sql-compare">
            <div class="sql-block source" @click="useExample(sqlExamples.postgresToMysql.source)">
              <div class="label">PostgreSQL</div>
              <code v-html="sqlExamples.postgresToMysql.sourceDisplay || sqlExamples.postgresToMysql.source"></code>
            </div>
            <div class="sql-block target">
              <div class="label">MySQL</div>
              <code>{{ sqlExamples.postgresToMysql.target }}</code>
            </div>
          </div>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon">
            <Document/>
          </el-icon>
          <h3>Oracle Translate to MySQL</h3>
          <div class="sql-compare">
            <div class="sql-block source" @click="useExample(sqlExamples.oracleToMysql.source)">
              <div class="label">Oracle</div>
              <code v-html="sqlExamples.oracleToMysql.sourceDisplay || sqlExamples.oracleToMysql.source"></code>
            </div>
            <div class="sql-block target">
              <div class="label">MySQL</div>
              <code>{{ sqlExamples.oracleToMysql.target }}</code>
            </div>
          </div>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon">
            <Document/>
          </el-icon>
          <h3>MySQL Translate to PostgreSQL</h3>
          <div class="sql-compare">
            <div class="sql-block source" @click="useExample(sqlExamples.mysqlToPostgres.source)">
              <div class="label">MySQL</div>
              <code>{{ sqlExamples.mysqlToPostgres.source }}</code>
            </div>
            <div class="sql-block target">
              <div class="label">PostgreSQL</div>
              <code>{{ sqlExamples.mysqlToPostgres.target }}</code>
            </div>
          </div>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon">
            <Document/>
          </el-icon>
          <h3>Oracle Translate to PostgreSQL</h3>
          <div class="sql-compare">
            <div class="sql-block source" @click="useExample(sqlExamples.oracleToPostgres.source)">
              <div class="label">Oracle</div>
              <code>{{ sqlExamples.oracleToPostgres.source }}</code>
            </div>
            <div class="sql-block target">
              <div class="label">PostgreSQL</div>
              <code>{{ sqlExamples.oracleToPostgres.target }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- right-side operation panel -->
      <div class="operation-panel">
        <!-- database selection area -->
        <div class="database-selector">
          <div id="source-db" class="source-db" style="width: 30%!important; min-width: 100px;">
            <label>{{ $t('dashboard.operation.sourceDb.label') }}</label>
            <el-select
                v-model="originalDB"
                class="db-select"
                size="large"
                :placeholder="$t('dashboard.operation.sourceDb.placeholder')"
            >
              <el-option
                  v-for="item in databaseOptions"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
              />
            </el-select>
          </div>

          <div id="target-db" class="target-db" style="width: 70%">
            <label>{{ $t('dashboard.operation.targetDb.label') }}</label>
            <el-select
                v-model="targetDB"
                class="db-select"
                size="large"
                :placeholder="$t('dashboard.operation.targetDb.placeholder')"
                popper-class="target-db-dropdown"
            >
              <template #header>
                <div class="db-select-header">
                  <el-input
                      v-model="searchKeyword"
                      :placeholder="$t('dashboard.operation.targetDb.search')"
                      :prefix-icon="Search"
                      size="default"
                      @keyup.enter="handleSearch"
                  />
                  <el-button
                      type="primary"
                      size="default"
                      @click="showAddDatabaseDialog"
                  >
                    {{ $t('dashboard.operation.targetDb.add') }}
                  </el-button>
                </div>
              </template>
              <el-option
                  v-for="item in targetDBList"
                  :key="item.id"
                  :label="`${item.db_type}-${item.username}@${item.host}:${item.port}/${item.database}`"
                  :value="item.id"
              >
                <div class="db-option">
                  <span class="db-type">{{ item.db_type }}</span>
                  <span class="db-info">{{ `${item.username}@${item.host}:${item.port}/${item.database}` }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>

        <!-- knowledge base selection area -->
        <div class="knowledge-selector">
          <div id="source-kb" class="source-kb" style="width: 30%!important; min-width: 100px;">
            <label>{{ $t('dashboard.operation.sourceKb.label') }}</label>
            <el-select
                v-model="originalKb"
                class="db-select"
                size="large"
                :placeholder="$t('dashboard.operation.sourceKb.placeholder')"
            >
              <el-option
                  v-for="item in knowledgeBaseOptions"
                  :key="item.id"
                  :label="item.kb_name"
                  :value="item.id"
              />
            </el-select>
          </div>
          <div id="target-kb" class="target-kb" style="width: 30%!important; min-width: 100px;">
            <label>{{ $t('dashboard.operation.targetKb.label') }}</label>
            <el-select
                v-model="targetKb"
                class="db-select"
                size="large"
                :placeholder="$t('dashboard.operation.targetKb.placeholder')"
            >
              <el-option
                  v-for="item in knowledgeBaseOptions"
                  :key="item.id"
                  :label="item.kb_name"
                  :value="item.id"
              />
            </el-select>
          </div>
          <div id="llm-model" class="llm-model" style="width: 30%!important; min-width: 100px;">
            <label>{{ $t('dashboard.operation.llmModel.label') }}</label>
            <el-select
                v-model="llmModel"
                class="db-select"
                size="large"
                :placeholder="$t('dashboard.operation.llmModel.placeholder')"
            >
              <el-option
                  v-for="item in llmModelOptions"
                  :key="item.name"
                  :label="item.name"
                  :value="item.name"
              />
            </el-select>
          </div>
        </div>

        <!-- SQL input area -->
        <div class="sql-input">
          <el-input
              id="sql-input"
              v-model="userInput"
              type="textarea"
              rows="auto"
              :placeholder="$t('dashboard.operation.sql.placeholder')"
          />
          <el-button
              id="convert-btn"
              type="primary"
              size="large"
              :disabled="sendBtnDisabled"
              @click="onSendClick"
              style="margin: 20px 0"
          >
            {{ $t('dashboard.operation.convert') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- add database configuration dialog -->
    <el-dialog
        v-model="addDatabaseDialogVisible"
        :title="$t('dashboard.dialog.add.title')"
        width="80%"
        destroy-on-close
    >
      <DatabaseConfigForm ref="databaseConfigFormRef" :initial-data="editForm"/>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDatabaseDialogVisible = false">
            {{ $t('dashboard.dialog.add.cancel') }}
          </el-button>
          <el-button type="primary" @click="onSaveClick">
            {{ $t('dashboard.dialog.add.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="Index">
import {createDatabaseReq, databaseListReq, supportDatabaseReq} from '@/api/database'
import {createRewriteReq} from '@/api/rewrite.js'
import {knowledgeListReq} from '@/api/knowledge'
import DatabaseConfigForm from '@/components/DatabaseConfigForm.vue';
import type {DatabaseConfig} from "@/types/database";
import {llmModelsReq} from '@/api/models'
import {Connection, Document, Monitor, Search} from '@element-plus/icons-vue'
import {ElMessage} from "element-plus";
import {computed, onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'

const i18n = useI18n()

// database type options
const databaseOptions = ref([])
const knowledgeBaseOptions = ref([])
const llmModelOptions = ref([])

const userInput = ref('')
const databaseConfigFormRef = ref()

const sendBtnDisabled = computed(() => {
  return userInput.value === '' || targetDB.value === '' || originalDB.value === ''
})

const sendBtnDisabledText = computed(() => {
  if (userInput.value === '') {
    return i18n.t('dashboard.operation.validation.noSql')
  }
  if (originalDB.value === '') {
    return i18n.t('dashboard.operation.validation.noSource')
  }
  if (targetDB.value === '') {
    return i18n.t('dashboard.operation.validation.noTarget')
  }
  return ''
})

const router = useRouter()

// SQL example data
const sqlExamples = reactive({
  postgresToMysql: {
    source: 'SELECT DISTINCT "t1"."id" , EXTRACT(YEAR FROM CURRENT_TIMESTAMP) - EXTRACT(YEAR FROM CAST( "t1"."birthday" AS TIMESTAMP )) FROM "patient" AS "t1" INNER JOIN "examination" AS "t2" ON "t1"."id" = "t2"."id" WHERE "t2"."rvvt" = \'+\'',
    target: "SELECT DISTINCT t1.id , DATE_FORMAT( CAST( CURRENT_TIMESTAMP( ) AS DATETIME ) , '%Y' ) - DATE_FORMAT( CAST( t1.birthday AS DATETIME ) , '%Y' ) FROM patient AS t1 INNER JOIN examination AS t2 ON t1.id = t2.id WHERE t2.rvvt = '+'",
    sourceDisplay: 'SELECT DISTINCT "t1"."id" , EXTRACT(YEAR FROM CURRENT_TIMESTAMP) - EXTRACT(YEAR FROM CAST( "t1"."birthday" AS TIMESTAMP )) FROM "patient" AS "t1" INNER JOIN "examination" AS "t2" ON "t1"."id" = "t2"."id" WHERE "t2"."rvvt" = \'+\''
  },
  oracleToMysql: {
    source: "SELECT NVL(employee_name, 'Unknown') as name, TO_CHAR(hire_date, 'YYYY-MM-DD') as hire_date FROM employees WHERE department_id = 10 AND ROWNUM <= 100",
    target: "SELECT IFNULL(employee_name, 'Unknown') as name, DATE_FORMAT(hire_date, '%Y-%m-%d') as hire_date FROM employees WHERE department_id = 10 LIMIT 100",
    sourceDisplay: "SELECT NVL(employee_name, 'Unknown') as name, TO_CHAR(hire_date, 'YYYY-MM-DD') as hire_date FROM employees WHERE department_id = 10 AND ROWNUM &lt;= 100",
  },
  mysqlToPostgres: {
    source: "SELECT CONCAT(first_name, ' ', last_name) as full_name, DATEDIFF(NOW(), birth_date) / 365 as age FROM customers WHERE id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) > 5)",
    target: "SELECT first_name || ' ' || last_name as full_name, EXTRACT(YEAR FROM AGE(NOW(), birth_date)) as age FROM customers WHERE id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) > 5)"
  },
  oracleToPostgres: {
    source: `SELECT e.employee_id, e.employee_name, d.department_name, 
  CONNECT_BY_ROOT e.employee_name as top_manager
FROM employees e 
JOIN departments d ON e.department_id = d.department_id
START WITH e.manager_id IS NULL
CONNECT BY PRIOR e.employee_id = e.manager_id`,
    target: `WITH RECURSIVE emp_hierarchy AS (
  SELECT e.employee_id, e.employee_name, e.manager_id, d.department_name, e.employee_name as top_manager
  FROM employees e JOIN departments d ON e.department_id = d.department_id
  WHERE e.manager_id IS NULL
  UNION ALL
  SELECT e.employee_id, e.employee_name, e.manager_id, d.department_name, h.top_manager
  FROM employees e 
  JOIN departments d ON e.department_id = d.department_id
  JOIN emp_hierarchy h ON e.manager_id = h.employee_id
)
SELECT employee_id, employee_name, department_name, top_manager FROM emp_hierarchy`
  }
})

const originalDB = ref("PostgreSQL")
const originalKb = ref("")
const targetDB = ref("")
const targetKb = ref("")
const llmModel = ref("")
const targetDBList = ref<DatabaseConfig[]>([])
const total = ref(0)

const editForm = reactive<DatabaseConfig>({
  host: '',
  username: '',
  password: '',
  database: '',
  port: '',
  db_type: '',
  description: ''
});

const addDatabaseDialogVisible = ref(false)

const showAddDatabaseDialog = () => {
  addDatabaseDialogVisible.value = true
}

const searchKeyword = ref('')

// search handling
const handleSearch = () => {
  getDatabaseList()
}

// modified method to get the database list
const getDatabaseList = async () => {
  try {
    const res = await databaseListReq(100, 0, searchKeyword.value)  // get configs with a search keyword
    targetDBList.value = res.data.data
    total.value = res.data.total
  } catch (error) {
    console.error('Failed to get database list:', error)
    ElMessage.error('Failed to get database list')
  }
}

// get knowledge base list
const getKnowledgeList = async () => {
  try {
    const res = await knowledgeListReq()
    knowledgeBaseOptions.value = res.data
  } catch (error) {
    console.error('Failed to get knowledge base list:', error)
  }
}

// get list of supported database types
const getSupportDatabaseOptions = async () => {
  const res = await supportDatabaseReq()
  databaseOptions.value = res.data
}


const fetchModels = async () => {
  try {
    const res = await llmModelsReq({category: 'llm'})
    llmModelOptions.value = res.data.items
  } catch (error) {
    ElMessage.error(error.message || i18n.t('models.message.fetchError', {
      type: 'LLM'
    }))
  }
}

onMounted(() => {
  // get database configuration list
  getDatabaseList()
  // get list of supported database types
  getSupportDatabaseOptions()
  // get knowledge base list
  getKnowledgeList()
  // get LLM model list
  fetchModels()
});

const onSendClick = async () => {
  try {
    // get the selected target database configuration
    const targetConfig = targetDBList.value.find(item => item.id === Number.parseInt(targetDB.value))
    if (!targetDB.value) {
      ElMessage.error('Please select a target database')
      return
    }
    // build the params to create the rewrite history
    const data = {
      source_db_type: originalDB.value,
      source_kb_id: originalKb.value,
      target_kb_id: targetKb.value,
      original_sql: userInput.value,
      llm_model_name: llmModel.value,
      target_db_id: targetConfig.id
    }

    // create rewrite history
    await createRewriteReq(data)

    // navigate to the chat page
    router.push('/chat')

  } catch (error) {
    console.error('Failed to create rewrite history:', error)
  }
}

// save database configuration
const onSaveClick = async () => {
  try {
    if (!databaseConfigFormRef.value) return
    const formData = await databaseConfigFormRef.value.validateForm()
    await createDatabaseReq(formData)
    ElMessage.success('Created successfully')
    getDatabaseList()  // refresh list
    addDatabaseDialogVisible.value = false  // close dialog
  } catch (error) {
    console.error('Failed to save:', error)
    if (error !== 'Form validation failed') {
      ElMessage.error('Failed to save')
    }
  }
}

// function to add an example SQL to the input box
const useExample = (exampleSql) => {
  userInput.value = exampleSql
}

</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: calc(100vh - 30px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.1) 100%),
  linear-gradient(to right, #f6f7f9 0%, #eef1f5 100%);
  background-size: cover;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 400px;
    background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-5) 100%);
    opacity: 0.1;
    z-index: 0;
  }
}

.header-section {
  position: relative;
  z-index: 1;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
  }

  .title-area {
    text-align: left;
  }

  h1 {
    font-size: 2.5em;
    color: var(--el-color-primary);
    margin-bottom: 16px;
    font-weight: 600;
  }

  p {
    font-size: 1.2em;
    color: #666;
  }

}

.main-section {
  display: flex;
  gap: 40px;
  flex: 1;
}

.features-panel {
  width: 30%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-primary-light-5);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--el-color-primary);
  }

  .feature-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    transition: transform 0.3s ease;
    border-left: 4px solid var(--el-color-primary);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .feature-icon {
      font-size: 24px;
      color: #666;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 1.1em;
      margin-bottom: 16px;
      color: var(--el-color-primary);
      font-weight: 600;
    }

    .sql-compare {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
    }

    .sql-block {
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-size: 0.9em;
        color: var(--el-color-primary);
        font-weight: 600;
        margin-bottom: 4px;
      }

      code {
        display: block;
        background: #2b2b2b;
        color: #fff;
        padding: 12px;
        border-radius: 4px;
        font-family: 'Monaco', monospace;
        font-size: 0.85em;
        line-height: 1.5;
        white-space: pre-wrap;
      }
    }

    .source {
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        &::after {
          content: 'Click to use this example';
          position: absolute;
          top: 0;
          right: 0;
          background: var(--el-color-primary);
          color: white;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 0 4px 0 4px;
        }

        code {
          border: 1px solid var(--el-color-primary);
        }
      }
    }
  }
}

.operation-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.database-selector {
  display: flex;
  align-items: center;
  gap: 24px;

  .source-db,
  .target-db {
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }

    .db-select {
      width: 100%;
    }
  }
}

.knowledge-selector {
  display: flex;
  align-items: center;
  gap: 24px;

  .source-kb,
  .target-kb,
  .llm-model{
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }
  }
}

.sql-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;

  .el-textarea {
    flex: 1;
    display: flex;
  }

  :deep(.el-textarea__inner) {
    flex: 1;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    font-family: 'Monaco', monospace;

    &:focus {
      border-color: var(--el-color-primary);
    }
  }

  .el-button {
    align-self: flex-end;
    padding: 12px 40px;
    margin-top: 20px;
  }
}

.db-select-header {
  padding: 16px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.db-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;

  .db-type {
    font-weight: bold;
  }

  .db-info {
    font-weight: lighter;
  }
}
</style>
