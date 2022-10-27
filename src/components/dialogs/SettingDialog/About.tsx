import { Content } from '@/components/base'
import { css } from '@emotion/css'

const AboutSetting = () => {
  return (
    <Content flex column style={{ fontWeight: 500, fontSize: 15 }}>
      <p>Rendevoz is an open-source & free application aims to help people have better learning experience 🙋‍♂️.</p>
      <p>Right now it is still under development and has a lot of bugs. Sorry for your bad experience if you meet one 🙇‍♂️.</p>
      <p>
        <span>If you like this project, please give me a ⭐! I will really appreciate that 🥰!</span>
        <br></br>
        <a href="https://github.com/RealRong/Rendevoz" target="_blank">
          https://github.com/RealRong/Rendevoz
        </a>
      </p>
      <p style={{ marginLeft: 'auto', fontWeight: 600 }}>Yours sincerely &nbsp;&nbsp;&nbsp; RealRong 2001 👨‍💻</p>
    </Content>
  )
}

export default AboutSetting
