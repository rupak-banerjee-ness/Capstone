<template>
  <div class="errPage-container">
    <el-button icon="el-icon-arrow-left" class="pan-back-btn" @click="back">Back</el-button>
    <el-row>
      <el-col :span="12">
        <h1 class="text-jumbo text-ginormous">Oops!</h1>
        gif source
        <a href="https://zh.airbnb.com/" target="_blank">airbnb</a>
        page
        <h2>You don't have permission to access this page</h2>
        <h6>If you're unhappy about this, please contact your manager</h6>
        <ul class="list-unstyled">
          <li>Or you can go to:</li>
          <li class="link-type">
            <router-link to="/dashboard">Back to home</router-link>
          </li>
          <li class="link-type">
            <a href="https://www.taobao.com/">Take a look around</a>
          </li>
          <li><a href="#" @click.prevent="dialogVisible = true">Click me to see a picture</a></li>
        </ul>
      </el-col>
      <el-col :span="12">
        <img :src="errGif" width="313" height="428" alt="Girl has dropped her ice cream." />
      </el-col>
    </el-row>
    <el-dialog v-model="dialogVisible" title="Just take a look">
      <img :src="ewizardClap" class="pan-img" />
    </el-dialog>
  </div>
</template>

<script setup>
import errGif from '@/assets/401_images/401.gif'

const state = reactive({
  errGif: `${errGif  }?${  Date.now()}`,
  ewizardClap: 'https://wpimg.wallstcn.com/007ef517-bafd-4066-aae4-6883632d9646',
  dialogVisible: false
})

const route = useRoute()
const router = useRouter()
const back = () => {
  if (route.query.noGoBack) {
    router.push({ path: '/dashboard' })
  } else {
    router.go(-1)
  }
}
//export properties for use in the page
const { ewizardClap, dialogVisible } = toRefs(state)
</script>

<style lang="scss" scoped>
.errPage-container {
  width: 800px;
  max-width: 100%;
  margin: 100px auto;
  .pan-back-btn {
    background: #008489;
    color: #fff;
    border: none !important;
  }
  .pan-gif {
    margin: 0 auto;
    display: block;
  }
  .pan-img {
    display: block;
    margin: 0 auto;
    width: 100%;
  }
  .text-jumbo {
    font-size: 60px;
    font-weight: 700;
    color: #484848;
  }
  .list-unstyled {
    font-size: 14px;
    li {
      padding-bottom: 5px;
    }
    a {
      color: #008489;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
