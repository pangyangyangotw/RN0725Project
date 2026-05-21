import React from 'react';

import {
  View,
  StyleSheet,
  TouchableHighlight,
  Linking,
  TouchableOpacity
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import CustomTextInput from '../../custom/CustomTextInput';
import Theme from '../../res/styles/Theme';
import CommonService from '../../service/CommonService';
import ViewUtil from '../../util/ViewUtil';
import I18nUtil from '../../util/I18nUtil';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CustomActioSheet from '../../custom/CustomActionSheet';

export default class ForgetPwdScreen1 extends SuperView {
  constructor(props) {
    super(props);
    this._navigationHeaderView = {
      title: '忘记密码'
    }
    this.state = {
      mobile: '',
      validateCode: '',
      btnValideTxt: '发送验证码',
      validateSeconds: 60,
      telText: I18nUtil.translate('联系客服'),
      account:null,
      email:null,
      emailValidateCode:null,
      options:['+86 10 57301448（北京）','+86 21 20437368（上海）','+86 20 28657801（广州）'],
      countShow:false,
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.validateTimer && clearTimeout(this.validateTimer);
  }
  /**
   *  发送验证码
   */
  btnSendValidateCode = () => {
      if (!this.state.mobile) {
        this.toastMsg('手机号不能为空');
        return;
      }
      if (this.state.btnValideTxt !== '发送验证码') {
        return;
      }
      const getValidateModel = {
        mobile: this.state.mobile
      };
      this.showLoadingView();
      CommonService.sendValidateCode(getValidateModel).then((response) => {
        this.hideLoadingView();
        if (response && response.success) {
          this.validateTimer = setInterval(() => {
            if (this.state.validateSeconds === 0) {
              if (this.validateTimer) {
                clearInterval(this.validateTimer);
              }
              this.setState(() => ({
                validateSeconds: 60,
                btnValideTxt: '发送验证码'
              }));
            } else {
              this.setState(() => ({
                validateSeconds: this.state.validateSeconds - 1,
                btnValideTxt: this.state.validateSeconds + ''
              }));
            }
          }, 1000);
        } else {
          this.toastMsg(response.message || '获取验证码失败');
        }
      }).catch((error) => {
        this.hideLoadingView();
        this.toastMsg(error.message || '获取验证码失败');
      });
  }

  btnSendValidateEmailCode = () => {
      const { countShow } = this.state;
      if (countShow) {
        if(!this.state.account){
          this.toastMsg('账号不能为空');
          return;
        }else{
          this.sendEmailValidateCode();
          return;
        }
      }
      if (!this.state.email) {
        this.toastMsg('邮箱不能为空');
        return;
      }
      let model = {
        Email: this.state.email,
      };

      this.showLoadingView();
      CommonService.QuerySerialNumberByEmail(model).then((response) => {
        this.hideLoadingView();
        if (response && response.success) {
          this.setState({
            account:response.data
          },()=>{
            this.sendEmailValidateCode();
          })
          
        } else {
          this.setState({
            countShow:true
          })
          this.toastMsg(response.message || '邮箱重复，请重新输入账号');
        }
      }).catch((error) => {
        this.hideLoadingView();
        this.toastMsg(error.message || '获取数据异常');
      });
  }
  sendEmailValidateCode = () => {
      const getValidateModel = {
        SerialNumber: this.state.account || null,
        Email: this.state.email,
        Source: 2
      };
      this.showLoadingView();
      CommonService.forgetPasswordSendEmail(getValidateModel).then((response) => {
        this.hideLoadingView();
        if (response && response.success) {
          this.showAlertView('验证码已发送至邮箱，请注意查收！', () => {
              return ViewUtil.getAlertButton('确定', () => {
                  this.dismissAlertView();
              })
          })
        } else {
          this.setState({
            countShow:true
          })
          this.toastMsg(response.message || '验证码发送失败');
        }
      }).catch((error) => {
        this.hideLoadingView();
        this.toastMsg(error.message || '获取数据异常');
      });
  }

  btnNextStep = () => {
    if (!this.state.mobile) {
      this.toastMsg('手机号不能为空');
      return;
    }
    if (!this.state.validateCode) {
      this.toastMsg('验证码不能为空');
      return;
    }
    let validateModel = {
      mobile: this.state.mobile,
      code: this.state.validateCode
    };
    this.showLoadingView();
    CommonService.checkValidaCode(validateModel).then(response => {
      this.hideLoadingView();
      if (response && response.success) {
        this.push('Forget2', validateModel);
      } else {
        this.toastMsg(response.message || '验证码不正确');
      }
    }).catch(err => {
      this.hideLoadingView();
      this.toastMsg('验证码校验失败');
    });
  }

  btnEmailNextStep = () => {
    if (!this.state.account) {
      this.toastMsg('账号不能为空');
      return;
    }
    if (!this.state.email) {
      this.toastMsg('邮箱不能为空');
      return;
    }
    if (!this.state.emailValidateCode) {
      this.toastMsg('验证码不能为空');
      return;
    }
    let validateModel1 = {
      SerialNumber: this.state.account || null,
      Email:this.state.email,
      EmailCode: this.state.emailValidateCode,
      Source:2
    };
    this.push('Forget2', validateModel1);
  }

  renderBody() {
    const { isTravelOrder,options } = this.state;
    return (
      <View style={{ flex: 1,backgroundColor:'#fff' }}>
          <View style={curStyle.header_view}>
              <View style={curStyle.center}>
                  <CustomText text='手机号重置' style={{ fontWeight: isTravelOrder ? ('bold','900') : 'normal' ,fontSize:isTravelOrder ?15:14,color:isTravelOrder?Theme.theme:Theme.commonFontColor}} onPress={() => {
                    if (!isTravelOrder) {
                      this.setState({ 
                        isTravelOrder: true,
                        countShow:false,
                      })
                    }
                  }} />
                  <View style={[curStyle.header_line, { backgroundColor: isTravelOrder ? Theme.theme : 'transparent' }]}></View>
              </View>
              <View style={curStyle.center}>
                  <CustomText text='邮箱重置' style={{ fontWeight: !isTravelOrder ? 'normal' : ('bold','900'),fontSize:!isTravelOrder ?15:14,color:!isTravelOrder?Theme.theme:Theme.commonFontColor}} onPress={() => {
                    if (isTravelOrder) {
                      this.setState({ isTravelOrder: false })
                    }
                  }} />
                  <View style={[curStyle.header_line2, { backgroundColor: isTravelOrder ? 'transparent' : Theme.theme }]}></View>
              </View>
          </View>
          <View style={{ flex: 1 }}>
                      {this._renderNumber()}
                      {this._renderEmail()}
          </View>
          <CustomActioSheet ref={o => this.actionSheet = o} options={options} title={'客服电话'} onPress={this._handlePress} />
      </View>
    );
  }

  _handlePress = (index) =>{

    let number = ['+86 10 57301448（北京）','+86 21 20437368（上海）','+86 20 28657801（广州）']
    let urlArr = ['tel:10 57301448 ','tel:21 20437368','tel:20 28657801']
    let url = urlArr[index]
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.log('Can\'t handle url: ' + url);
        }
      }).catch(err => {
        console.log(err);
      });
  }

  _renderNumber = () =>{
    const { isTravelOrder } = this.state;
    if (!isTravelOrder ) return null;
    return(
      <View style={{ flex:1 }}>
          <View style={[curStyle.viewStyle,{marginTop:40 }]}>
                  <CustomTextInput placeholder="请输入手机号" 
                      style={curStyle.rightTextInput} 
                      placeholderTextColor={Theme.promptFontColor} 
                      keyboardType='numeric' 
                      onChangeText={mobile => this.setState({ mobile })} 
                    />
          </View>
          <View style={curStyle.viewStyle}>
                  <CustomTextInput placeholder="请输入验证码" 
                  style={curStyle.rightTextInput} 
                  placeholderTextColor={Theme.promptFontColor}
                  keyboardType='numeric' 
                  onChangeText={(validateCode) => { this.setState({ validateCode }) }} 
                  />
                  <TouchableOpacity style={curStyle.verification} onPress={this.btnSendValidateCode}>
                    <CustomText style={{ color: Theme.theme}} text={this.state.btnValideTxt} />
                  </TouchableOpacity>
          </View>
          {
              ViewUtil.getSubmitButton('下一步', this.btnNextStep)
          }
          {/* <View style={{ justifyContent: 'flex-end', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity underlayColor='transparent' onPress={this.btnContactTel} style={curStyle.telStyle}>
              <MaterialIcons name={'phone'} size={15} color={Theme.theme} />
              <CustomText style={{ color: Theme.theme, fontSize: 13,marginLeft:3 }} text={this.state.telText} />
            </TouchableOpacity>
          </View> */}
          <View style={{ justifyContent: 'flex-end', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity underlayColor='transparent' onPress={()=>{this.actionSheet.show();}} style={curStyle.telStyle}>
              <MaterialIcons name={'phone'} size={15} color={Theme.theme} />
              <CustomText style={{ color: Theme.theme, fontSize: 13,marginLeft:3 }} text={this.state.telText} />
            </TouchableOpacity>
          </View>
      </View>
    )
  }
  _renderEmail = () =>{
    const { isTravelOrder,emailValidateCode,countShow } = this.state;
    if (isTravelOrder) return null;
    return(
      <View style={{flex:1,marginTop:20 }} >
          {
            countShow?
              <View style={{ flexDirection: 'row', alignItems: 'center',backgroundColor:Theme.normalBg, borderRadius:2, marginHorizontal:20,marginTop:20 }}>
                      <CustomTextInput placeholder="请输入账号" 
                          style={curStyle.rightTextInput} 
                          placeholderTextColor={Theme.promptFontColor} 
                          onChangeText={account => this.setState({ account })}
                        />
              </View>
            :null
          }
          <View style={curStyle.viewStyle}>
                  <CustomTextInput placeholder="请输入邮箱" 
                      style={curStyle.rightTextInput} 
                      placeholderTextColor={Theme.promptFontColor} 
                      onChangeText={email => this.setState({ email })}
                    />
          </View>
          <View style={curStyle.viewStyle}>
                  <CustomTextInput placeholder="请输入验证码" 
                  style={curStyle.rightTextInput} 
                  placeholderTextColor={Theme.promptFontColor}
                  keyboardType='numeric' 
                  onChangeText={(emailValidateCode) => { this.setState({ emailValidateCode }) }} 
                  />
                  <TouchableHighlight style={curStyle.verification}  onPress={this.btnSendValidateEmailCode}>
                     <CustomText style={{ color: Theme.theme }} text={'发送验证码'} />
                  </TouchableHighlight>
          </View>
          {
              ViewUtil.getSubmitButton('下一步', this.btnEmailNextStep)
          }
          <View style={{ justifyContent: 'flex-end', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity underlayColor='transparent' onPress={()=>{this.actionSheet.show();}} style={curStyle.telStyle}>
              <MaterialIcons name={'phone'} size={15} color={Theme.theme} />
              <CustomText style={{ color: Theme.theme, fontSize: 13,marginLeft:3 }} text={this.state.telText} />
            </TouchableOpacity>
          </View>
      </View>
    )
  }
}
const curStyle = StyleSheet.create({
  header_view: {
    marginTop:15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth:1,
    borderColor:Theme.normalBg
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header_line: {
    height: 2,
    width: 75,
    marginTop: 5
  },
  header_line2: {
    height: 2,
    width: 57,
    marginTop: 5
  },
  header_text: {
    color: Theme.fontColor,
  },
  rightTextInput: {
    height: 50,
    marginLeft: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize:14,
  },
  verification:{
    marginRight:10,
    height:50,
    justifyContent:'center',
    width:100,
    alignItems:'flex-end'
  },
  viewStyle:{ 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor:Theme.normalBg, 
    borderRadius:2, 
    marginHorizontal:20,
    marginTop:20 
  },
  telStyle:{ 
    marginBottom: 50, 
    flexDirection:'row'
    ,borderWidth:1,
    paddingVertical:6,
    paddingHorizontal:18,
    borderRadius:2 ,
    borderColor:Theme.theme
  }
});