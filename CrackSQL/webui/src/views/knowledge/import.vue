<template>
  <div class="import-container">
    <!-- top back button and title -->
    <div class="header">
      <div class="columnSS" style="width: 100%;">
        <div v-if="currentStep === 1" class="rowSC">
          <el-button icon="ArrowLeftBold" type="primary" plain circle size="large" @click="router.back()" />
          <span style="font-weight: bold; font-size: 22px;">{{ route.query.kb_name }}</span>
        </div>
        <div v-else class="rowSC">
          <el-button icon="ArrowLeftBold" type="primary" plain size="default" @click="currentStep--">
            {{ $t('knowledge.import.prevStep') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- step indicator -->
    <el-steps :active="currentStep" finish-status="success" class="steps" align-center>
      <el-step :title="$t('knowledge.detail.steps.selectFile')" />
      <el-step :title="$t('knowledge.detail.steps.process')" />
      <el-step :title="$t('knowledge.detail.steps.addQueue')" />
    </el-steps>

    <!-- file upload area -->
    <div class="main-content">
      <!-- step 1: select file -->
      <div v-if="currentStep === 1">
        <el-upload
          ref="uploadRef"
          class="upload-drop"
          drag
          multiple
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          :before-remove="handleFileRemove"
          :on-exceed="handleExceed"
          :limit="15"
          accept=".json"
        >
          <el-icon class="upload-icon">
            <Upload />
          </el-icon>
          <div class="upload-text">{{ $t('knowledge.import.upload.text') }}</div>
          <div class="upload-tip">
            {{ $t('knowledge.import.upload.tip') }}
            <br />
            {{ $t('knowledge.import.upload.limit') }}
          </div>
        </el-upload>

        <!-- file parsing progress -->
        <div v-if="fileList.length > 0" class="file-list">
          <div class="file-list-header">
            <div class="file-name">{{ $t('knowledge.import.fileList.name') }}</div>
            <div class="file-progress">{{ $t('knowledge.import.fileList.progress') }}</div>
            <div class="file-count">{{ $t('knowledge.import.fileList.count') }}</div>
            <div class="file-action">{{ $t('knowledge.import.fileList.action') }}</div>
          </div>
          <div v-for="(file, index) in fileList" :key="index" class="file-item">
            <div class="file-name">
              <el-icon>
                <Document />
              </el-icon>
              {{ file.name }}
            </div>
            <div class="file-progress">
              <el-progress :percentage="file.parseProgress || 0" :status="file.parseStatus" />
            </div>
            <div class="file-count">
              {{ file.itemCount || 0 }} {{ $t('knowledge.import.fileList.items') }}
            </div>
            <div class="file-action">
              <el-button type="danger" link @click="handleRemoveFile(index)">
                {{ $t('knowledge.import.fileList.delete') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- step 2: data processing -->
      <div v-if="currentStep === 2">
        <div v-if="jsonItems.length > 0" class="json-preview">
          <div class="preview-header">
            <span class="title">
              {{ $t('knowledge.import.preview.title') }} ({{ jsonItems.length }} {{ $t('knowledge.import.preview.count') }})
            </span>
          </div>

          <div class="cards-container">
            <el-card
              v-for="(item, index) in paginatedItems"
              :key="((currentPage - 1) * pageSize) + index"
              class="item-card"
              shadow="hover"
            >
              <div class="card-content">
                <div class="card-header">
                  <span class="operator">#{{ ((currentPage - 1) * pageSize) + index + 1 }}</span>
                  <div class="actions">
                    <el-button type="primary" link @click="handlePreview(((currentPage - 1) * pageSize) + index)">
                      {{ $t('knowledge.import.card.preview') }}
                    </el-button>
                    <el-button type="primary" link @click="handleEdit(((currentPage - 1) * pageSize) + index)">
                      {{ $t('knowledge.import.card.edit') }}
                    </el-button>
                    <el-button type="danger" link @click="handleDeleteItem(((currentPage - 1) * pageSize) + index)">
                      {{ $t('knowledge.import.card.delete') }}
                    </el-button>
                  </div>
                </div>
                <div class="key-value-list">
                    <div v-for="(value, key) in commonUtil.flattenObject(item)" :key="key" class="key-value-item">
                      <div class="key-label">{{ key }}:</div>
                      <pre class="value-content">{{ formatValue(value) }}</pre>
                    </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- pagination -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalItems"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>

      <!-- step 3: add to task queue -->
      <div v-if="currentStep === 3" class="process-container">
        <div class="process-content">
          <div class="rowCC" style="width: 100%">
            <el-icon style="font-size: 48px; color: var(--el-color-success); margin-right: 10px">
              <CircleCheckFilled />
            </el-icon>
            <span style="font-size: 16px">
              {{ $t('knowledge.import.addQueue', { countdown }) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- bottom button -->
    <div class="footer rowEC" style="width: 100%; margin-top: 20px;">
      <el-button
        type="primary"
        size="default"
        :disabled="!canProceed"
        @click="handleNextStep"
        :loading="uploading"
      >
        {{ getButtonText }}
      </el-button>
    </div>

    <!-- edit dialog -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editDialogIsPreview ? 'Preview' : 'Edit'"
      width="80%"
      top="3vh"
      :close-on-click-modal="false"
    >
      <div v-if="currentEditItem" class="edit-form">
        <el-input
          v-model="jsonEditString"
          type="textarea"
          :disabled="editDialogIsPreview"
          :rows="50"
          placeholder="Please enter the JSON data"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">
            Cancel
          </el-button>
          <el-button v-if="!editDialogIsPreview" type="primary" @click="handleSaveEdit">
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload, CircleCheckFilled, Document } from '@element-plus/icons-vue'
import { addKnowledgeBaseItemsReq, vectorizeKnowledgeBaseItemsReq } from '@/api/knowledge'
import { useI18n } from '@/hooks/use-i18n'
import commonUtil from '@/utils/common-util'

const router = useRouter()
const route = useRoute()
const uploadRef = ref()
const i18n = useI18n()

interface JsonItem {
  [key: string]: any
}

// el-upload's file type
interface UploadFile extends File {
  raw: File
}

// jsonItems type declaration
const jsonItems = ref<JsonItem[]>([])
const uploading = ref(false)
const currentStep = ref(1)
const countdown = ref(3)
const fileList = ref<any[]>([])
const editDialogIsPreview = ref(false)

// pagination-related reactive variables
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = computed(() => jsonItems.value.length)

// compute current page data
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return jsonItems.value.slice(start, end)
})

// handle page number change
const handlePageChange = (page: number) => {
  currentPage.value = page
}

// handle page size change
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// whether the next step can proceed
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return jsonItems.value.length > 0
    case 2:
      return jsonItems.value.length > 0
    case 3:
      return false
    default:
      return false
  }
})

// button text
const getButtonText = computed(() => {
  switch (currentStep.value) {
    case 1:
      return i18n.t('knowledge.import.button.next')
    case 2:
      return i18n.t('knowledge.import.button.upload')
    case 3:
      return i18n.t('knowledge.import.button.complete')
    default:
      return i18n.t('knowledge.import.button.next')
  }
})

// handle file count exceeding the limit
const handleExceed = () => {
  ElMessage.warning(i18n.t('knowledge.import.upload.exceed'))
}

// handle actions before a file is removed
const handleFileRemove = (file: any) => {
  const index = fileList.value.indexOf(file)
  if (index !== -1) {
    // remove this file's data from the overall dataset
    const removedFile = fileList.value[index]
    if (removedFile.items && removedFile.items.length > 0) {
      // remove all of this file's data from jsonItems
      jsonItems.value = jsonItems.value.filter(item => !removedFile.items.includes(item))
    }
    fileList.value.splice(index, 1)
  }
  return true
}

// handle file selection
const handleFileChange = async (file: UploadFile) => {
  if (!file) return

  // check file type
  if (!file.name.endsWith('.json')) {
    ElMessage.error('Please upload a JSON file')
    return
  }

  // add file to the list
  const fileItem = {
    name: file.name,
    raw: file.raw,
    parseProgress: 0,
    parseStatus: 'warning',
    itemCount: 0,
    items: [] as JsonItem[]
  }
  fileList.value.push(fileItem)

  // read file contents
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = JSON.parse(e.target?.result as string)
      const items = Array.isArray(content) ? content : [content]

      // update file list
      fileList.value = fileList.value.map(f =>
        f.name === file.name
          ? { ...f, parseProgress: 100, parseStatus: 'success', itemCount: items.length, items }
          : f
      )

      // merge into overall items
      jsonItems.value = fileList.value.reduce((acc, file) => {
        if (file.items && Array.isArray(file.items)) {
          return [...acc, ...file.items]
        }
        return acc
      }, [])
    } catch (error) {
      fileList.value = fileList.value.map(f =>
        f.name === file.name
          ? { ...f, parseProgress: 100, parseStatus: 'exception' }
          : f
      )
      ElMessage.error(`${file.name}: failed to parse JSON file`)
      console.error('JSON parse error:', error)
    }
  }
  reader.readAsText(file.raw as Blob)
}

// delete file
const handleRemoveFile = (index: number) => {
  const removedFile = fileList.value[index]
  if (removedFile.items && removedFile.items.length > 0) {
    // remove all of this file's data from jsonItems
    jsonItems.value = jsonItems.value.filter(item => !removedFile.items.includes(item))
  }
  fileList.value.splice(index, 1)
}

// delete a single item
const handleDeleteItem = (index: number) => {
  jsonItems.value.splice(index, 1)
}

// handle next step
const handleNextStep = async () => {
  if (currentStep.value === 2) {
    // upload clicked on step 2
    await handleUpload()
  } else if (currentStep.value < 3) {
    currentStep.value++
  }
}

// upload data to the knowledge base
const handleUpload = async () => {
  if (jsonItems.value.length === 0) {
    ElMessage.warning('Please select data to upload first')
    return
  }

  try {
    uploading.value = true
    const res = await addKnowledgeBaseItemsReq(route.query.kb_name as string, jsonItems.value)
    if (res.data.status === true) {
      const itemIds = res.data.data.success_ids || []
      const vectorizeRes = await vectorizeKnowledgeBaseItemsReq(route.query.kb_name as string, itemIds)
      if (vectorizeRes.data.status === true) {
        currentStep.value = 3
        // navigate back after countdown
        const timer = setInterval(() => {
          countdown.value--
          if (countdown.value <= 0) {
            clearInterval(timer)
            router.back()
          }
        }, 1000)
      } else {
        ElMessage.error(vectorizeRes.data.message || 'Vectorize failed')
      }
    } else {
      ElMessage.error(res.data.message || 'Upload failed')
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Upload failed')
  } finally {
    uploading.value = false
  }
}

const editDialogVisible = ref(false)
const currentEditItem = ref<JsonItem | null>(null)
const currentEditIndex = ref(-1)
const jsonEditString = ref('')

// handle preview
const handlePreview = (index: number) => {
  currentEditIndex.value = index
  currentEditItem.value = jsonItems.value[index]
  jsonEditString.value = JSON.stringify(currentEditItem.value, null, 2)
  editDialogIsPreview.value = true
  editDialogVisible.value = true
}

// handle edit
const handleEdit = (index: number) => {
  currentEditIndex.value = index
  currentEditItem.value = jsonItems.value[index]
  jsonEditString.value = JSON.stringify(currentEditItem.value, null, 2)
  editDialogIsPreview.value = false
  editDialogVisible.value = true
}

// save edit
const handleSaveEdit = () => {
  try {
    const parsedJson = JSON.parse(jsonEditString.value)
    if (currentEditIndex.value !== -1) {
      jsonItems.value[currentEditIndex.value] = parsedJson
    }
    editDialogVisible.value = false
  } catch (error) {
    ElMessage.error('Invalid JSON format, please check the format')
  }
}

// format the displayed value
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '-'
  }
  if (Array.isArray(value)) {
    return value.length > 50
      ? `[Array(${value.length})]`
      : JSON.stringify(value)
  }
  if (typeof value === 'object') {
    return '[Object]'
  }
  if (typeof value === 'string' && value.length > 100) {
    return value.slice(0, 100) + '...'
  }
  return String(value)
}
</script>

<style scoped>
.import-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  margin-bottom: 20px;
}

.main-content {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  margin: 0 20px;
  flex: 1;
  overflow: hidden;
}

.upload-drop {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed #dcdfe6;
}

.upload-icon {
  font-size: 40px;
  color: var(--el-color-primary);
  margin-bottom: 10px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 10px;
}

.upload-tip {
  font-size: 14px;
  color: #909399;
  text-align: center;
  line-height: 1.5;
}

.json-preview {
  margin-top: 20px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-header .title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.columnSS {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}

.rowSC {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
}

.steps {
  margin-bottom: 20px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.process-container {
  display: flex;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.process-content {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
}

.rowCC {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.file-list {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.file-list-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 100px;
  padding: 12px 20px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 14px;
  border-bottom: 1px solid #ebeef5;
}

.file-item {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 100px;
  padding: 12px 20px;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-progress {
  padding-right: 20px;
}

.file-count {
  color: var(--el-color-primary);
  font-weight: bold;
}

/* edit input style */
.edit-input {
  transition: all 0.3s ease;
}

.edit-input:deep(.el-input__inner) {
  font-size: 14px;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

.edit-input:deep(.el-textarea__inner) {
  font-size: 14px;
  padding: 8px 12px;
  transition: all 0.3s ease;
  min-height: 60px;
}

/* input focus style */
.edit-input:deep(.el-input__inner:focus),
.edit-input:deep(.el-textarea__inner:focus) {
  transform: scale(1.02);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* table cell style */
:deep(.el-table__cell) {
  padding: 12px !important;
}

:deep(.el-table__row) {
  transition: all 0.3s ease;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-fill-color-light) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 400px);
}

.item-card {
  transition: all 0.3s ease;
  height: 450px;
  min-height: 100px;
}

.item-card:hover {
  transform: translateY(-5px);
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 12px;
  flex-shrink: 0;
}

.operator {
  font-size: 20px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.key-value-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: scroll;
  padding: 16px;
  height: 360px;
}

.key-value-item {
  display: flex;
  flex-direction: column;
}

.key-label {
  color: #606266;
  font-weight: 500;
  font-size: 14px;
  border-radius: 4px;
}

.value-content {
  margin: 0;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: #333;
}

.edit-form {
  padding: 20px;
  height: 82vh;
}

:deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>
