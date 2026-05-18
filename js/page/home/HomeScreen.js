import React from 'react';

import {
  View,
  Image,
  Platform,
  Linking,
  StyleSheet,
  ScrollView,
  AppState,
  TouchableHighlight,
  TouchableOpacity,
  DeviceEventEmitter,
  Text,
  Switch,
  ImageBackground,
  Alert,
  FlatList,
  Dimensions
} from 'react-native';

import Drawer from 'react-native-drawer';
import NavigationUtils from '../../navigator/NavigationUtils';
import SuperView from '../../super/SuperView';
import Theme from '../../res/styles/Theme';
import UserInfoDao from '../../service/UserInfoDao';
import CommonService from '../../service/CommonService';
import ComprehensiveService from '../../service/ComprehensiveService';
// import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import HomeUnTravelView from './view/HomeUnTravelView';//=*=
import I18nUtil from '../../util/I18nUtil';
import { connect } from 'react-redux';
import action from '../../redux/action';
import NoticeView from './view/NoticeView';
import AdCodeEnum from '../../enum/AdCodeEnum';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from'react-native-vector-icons/MaterialCommunityIcons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';
import CompCreateJourneyView from '../ComprehensiveOrder/CompCreateJourneyView';
import TabView from './view/TabView';
import Util from '../../util/Util';
// import SearchInput from '../../custom/SearchInput';
const FCM_SHOW_ADLIST = 'FCMSHOWADLIST';
// import Swiper from 'react-native-swiper';
import ViewUtil from '../../util/ViewUtil';
import AddpersonView from '../ComprehensiveOrder/View/AddpersonView';
import SonyList from '../../res/js/SonyList';
import UserInfoUtil from '../../util/UserInfoUtil';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import DepartView from '../common/DepartView';
import {TitleView,TitleView2} from '../../custom/HighLight';
// import AliyunPush from 'react-native-aliyun-push';//=*=
import HTMLView from 'react-native-htmlview';

let _this;

class HomeScreen extends SuperView {
  backPress;
  constructor(props) {
    super(props);
    this._navigationHeaderView = {
        title: '您好',
        // hide:true,
        statusBar: {
            backgroundColor: Theme.theme,
        },
        style: {
            backgroundColor: Theme.theme,
        },
        titleStyle: {
            color: 'white'
        },
        leftButton:<View/> 
    }
      // 修复参数获取方式，兼容 React Navigation v5/v6
      this.params = (props.route && props.route.params) ? props.route.params : {};
      _this = this
      StorageUtil.loadKey(Key.HomeAdd).then(result => {//判断广告弹不弹
        this.isShowHomeAdd = result
      }).catch(error => {
        // console.log(error);
      })
      StorageUtil.loadKey(Key.ShowTipAlert).then(result => {//判断完善信息弹窗是否需要弹出
        this.ShowTipAlert = result===1 ? false : true
      }).catch(error => {
        // console.log(error);
      })
      let businessCategory = null
      if(this.props.apply&&this.props.apply.selectApplyItem&&this.props.apply.selectApplyItem.BusinessCategory){
          businessCategory = this.props.apply.selectApplyItem.BusinessCategory
      }else if(this.props.apply&&this.props.apply.BusinessCategory){
          businessCategory = this.props.apply.BusinessCategory
      }
      this.state = {
      isIngore: false,
      appState: AppState.currentState,
      isTravelOrder: false,
      userInfo: { Customer: {} },
      customerInfo: null,
      runtimeEnv:null,//标识
      // 缓存数据 国内机票
      unUsedOrder: null,
      // 火车票
      unUsedTrainOrder: null,
      //国际机票
      unUsedIntlFlightOrder: null,
      //酒店
      unUsedHotelOrder: null,
      //港澳台及国际酒店
      unUserIntlHotelOrder: null,
      //广告
      noticeAdList: [],
      /**-----------------------------2021.2.22 综合订单相关-------------------------------- */
      selectApply: null,
      arrivalCity:'',
      compSwitchOnOff:false,//是否开启综合订单 1是true 2是false
      select: props.language,
      Notify_language:'zh-cn',
      notifySelect:{
           value:'zh',
           name: '简体中文',
           Notify_language:'zh-cn'
      },
      location:'',
      compSectionList:[],
      keyWord2:null,
      openType:false,

      isOpenAdList:false,
      IsTips:false, //false显示提示完善个人信息弹框，true不显示
      IsShowAlert:1,//是0的时候显示，1不显示
      IsHideChangePassword:false, //是否隐藏 修改密码弹窗 true隐藏
      IsAddShow:true,
      locationAlertShow:false,//打车定位提示栏
      // isTravelOrder:this.params.createNew?false:true,
      isTravelOrder:false,
      employees: [],
      travellers:[],
      ReferenceEmployee:{},
      typeList:[],
      businessCategory:businessCategory,
      selectTap:this.params.selectTap,//选择的业务,//选择的业务
      ReferenceEmployeeId:null,//选择的差标参考员工的Id
      ReferencePassengerId:null,//参考员工
      fingerLogin:false,
      publickeyId:'', 
      ProjectId:null,
      ProjectName:null,
      objectValue:false,
      ReferenceEmployeeName:'',
      ProjectItem:null,
      applyNum:this.props.apply&&this.props.apply.SerialNumber || null,//出差单号
      category:this.params.categoryId,
      arrivalCityDisplay:this.params.cityList&&this.params.cityList[1],
      goCityDisplay:this.params.cityList&&this.params.cityList[0],
      selectApplyItem:this.props.apply&&this.props.apply.selectApplyItem,
      chooseApply:true,//创建时是否选择了申请单
      // 费用归属
      ApproveOrigin: {},
      messageSummary:null,
      allMessNum:0,
      isDataReady: false,
    }
    this.intervalID = 0
  }
  _getruntimeEnv=()=>{
  CommonService.customerInfo().then(response => {
    if (response && response.success && response.data) {
        this.setState({
            runtimeEnv:response.data&&response.data.Addition&&response.data.Addition.SettingRuntimeEnv,
            IsHideChangePassword:response.data.Setting.HomePageConfig&&response.data.Setting.HomePageConfig.IsHideChangePassword
        })
    } else {
        // reject({ message: response.message || '获取客户信息失败' });
    }
  })
}
deleteBiometrics(){
    let model = {
        Key:this.state.publickeyId
    }
    CommonService.CurrentUserUnbindBiometric(model).then(response => {
        if (response.success) {
            const rnBiometrics = new ReactNativeBiometrics()
            rnBiometrics.deleteKeys().then((resultObject) => {
                const { keysDeleted } = resultObject
                if (keysDeleted) {
                console.log('Successful deletion')
                } else {
                console.log('Unsuccessful deletion because there were no keys to delete')
                }
                this.setState({
                    publickeyId:null,
                    fingerLogin:false
                })
                StorageUtil.removeKey(Key.Publickeyid);
            })
        } else {
          this.toastMsg('获取数据失败');
        }
      }).catch(error => {
        // this.hideLoadingView();
        // this.toastMsg(error.message || '获取国家数据异常');
      })
}
OpenBiometrics(){
    const rnBiometrics = new ReactNativeBiometrics()
    rnBiometrics.isSensorAvailable()
      .then((resultObject) => {
        const { available, biometryType } = resultObject
        if (available && biometryType === BiometryTypes.TouchID) {
          console.log('TouchID is supported')
           this.CreateBiometrics();
        } else if (available && biometryType === BiometryTypes.FaceID) {
          console.log('FaceID is supported');
          this.CreateBiometrics();
        } else if (available && biometryType === BiometryTypes.Biometrics) {
          console.log('Biometrics is supported')
          this.CreateBiometrics();
        } else {
          console.log('Biometrics not supported')
          let string = Platform.OS=='android'?'未开启指纹识别功能':'该设备不支持生物识别登录'
          this.showAlertView(string, () => {
            return ViewUtil.getAlertButton('确定', () => {
                this.dismissAlertView();
            })
        })
        }
      })
}
CreateBiometrics(){
    const rnBiometrics = new ReactNativeBiometrics()
    rnBiometrics.simplePrompt({promptMessage: 'Confirm fingerprint'}).then((resultObject) => {
         const { success } = resultObject
            if (success) {
              //  console.log('successful biometrics provided')
               rnBiometrics.createKeys().then((resultObject) => {
                const { publicKey } = resultObject
                // sendPublicKeyToServer(publicKey)
                let model = {
                  BiometriciKey:publicKey
                }
                CommonService.CurrentUserBiometriciBind(model).then(response => {
                  if (response.success && response.data) {
                     this.setState({
                        publickeyId:response.data.PublicKeyId,
                        fingerLogin:true
                    })
                     StorageUtil.saveKey(Key.Publickeyid, response.data.PublicKeyId);
                  } else {
                    this.toastMsg('获取数据失败');
                  }
                }).catch(error => {
                  this.toastMsg(error.message || '获取数据异常');
                })
              })
            } else {
               console.log('user cancelled biometric prompt')
            }
    }).catch(error => {
        this.toastMsg('尝试次数过多，请通过屏幕锁定功能解锁。');
    })
}

  _backBtnClick = ()=>{
    this._drawer.close();
    this.backPress && this.backPress.componentWillUnmount();
    return true;
  }
  push = (routeName, params)=>{
    super.push(routeName, params);
  }
  
  async componentDidMount() { 
        this.homeListener = DeviceEventEmitter.addListener(
          'creactNew',  //监听器名
          () => {
            this.setState({
              isTravelOrder:false//切换到新建订单
            })
          },
        );
        this.deleteApplyListener = DeviceEventEmitter.addListener('deleteApply',()=>{
          this.props.setApply(null);
          this.setState({
              applyNum:null,
              selectApplyItem:null,
              employees:[],
              travellers:[],
              ReferenceEmployeeId:null,
              ReferenceEmployeeName:null,
              ReferenceEmployee:null,
              // ProjectId:null,
              // ProjectName:null,
              // ProjectItem:null,
              // ApproveOrigin:{},
          })
        })
        this.letRefreshMassege = DeviceEventEmitter.addListener('refreshMassege',()=>{
          this.getCurrentUserMessageSummary();
        })
        this.pageEmit = DeviceEventEmitter.addListener('refreshHomeCreate',(res)=>{
          let businessCategory = null
          if(res.apply&&res.apply.selectApplyItem&&res.apply.selectApplyItem.BusinessCategory){
              businessCategory = res.apply.selectApplyItem.BusinessCategory
          }else if(res.apply&&res.apply.BusinessCategory){
              businessCategory = res.apply.BusinessCategory
          }
          this.setState({
            applyNum:res.apply&&res.apply.SerialNumber,//出差单号
            selectApplyItem:res.apply&&res.apply.selectApplyItem,
            arrivalCityDisplay:res.cityList&&res.cityList[1],
            goCityDisplay:res.cityList&&res.cityList[0],
            chooseApply:true,//创建时是否选择了申请单
            selectTap:res.selectTap,//选择的业务,//选择的业务
            category:res.categoryId,
            businessCategory:businessCategory,
          })
          this._getUserCustomerInfo();
          this._getData(); 
        })
        // 1. 先并行加载基础数据
        const basicDataPromises = [
          this._getUserCustomerInfo(),
          this._getData(),
          // this._getPushRegister()
        ];
        // 2. 并行执行，减少等待时间
        await Promise.all(basicDataPromises);
        // 3. 其他可以延迟加载的操作
        setTimeout(() => {
          this._currentUserMassInfo();
          this._getVersionUpGrade();
          this._getCraftTypeList();

        }, 500);

        StorageUtil.loadKeyId(FCM_SHOW_ADLIST).then(res => {
          if (res && res == 'on') {
              this.setState({
                  isOpenAdList: true
              })
          }
        }).catch(error => {
            this.setState({
                isOpenAdList: true
            })
        })
        StorageUtil.loadKey(Key.Publickeyid).then(result => {
          this.setState({
               fingerLogin:result?true:false,
               publickeyId:result
          })
       })
       this.setState({ isDataReady: true });
       this.fetchBookingConfig();

  }
  fetchBookingConfig = () => {
    let model = { 
      Key: "flightBookingConfig;trainBookingConfig;intlflightBookingConfig" 
    };
    CommonService.ProfileCommonEnum(model).then(response => {
      if (response?.success) {
        // 存储到redux/asyncstorage
        this.props.getProfileCommonEnum({
          bookingConfig: response.data
        });
      }
    }).catch(error => {
      console.error('配置获取失败:', error);
    });
  }

  //获取飞机机型列表
  _getCraftTypeList = () => {
    CommonService.GetCraftTypeList().then((response)=>{
      if(response.success && response.data){
        //储存在本地
        StorageUtil.saveKey(Key.CraftTypeList, response.data);
      }
    }).catch((error)=>{
        this.toastMsg(error.message);
    })
  }

  _getPushRegister = () => {
      // AliyunPush.getDeviceId()
      // .then((deviceId)=>{
      //       console.log("deviceId:"+deviceId);
      //       this.setState({
      //         deviceId:deviceId
      //       },()=>{
      //         this.PushRegister();
      //       })
      // })
      // .catch((error)=>{
      //     console.log("getDeviceId() failed",error);
      //     console.log(JSON.stringify(error));
      // }); 
      // AliyunPush.addListener(this.handleAliyunPushMessage);
  }
  PushRegister(){
      let model ={
        DeviceToken:this.state.deviceId
      }
      CommonService.AppPushRegister(model).then((response)=>{
        if(response.success){
          // console.log('推送设备注册成功')
        }
      })
  }

  handleAliyunPushMessage = (msg) => {
    // console.log("Message Received. " + JSON.stringify(msg));
      if(msg.actionIdentifier == "opened"){
        this.push('NewNoticeCenterScreen',{messageSummary:this.state.messageSummary});
      }

      //e结构说明:
      //e.type: "notification":通知 或者 "message":消息
      //e.title: 推送通知/消息标题
      //e.body: 推送通知/消息具体内容
      //e.actionIdentifier: "opened":用户点击了通知, "removed"用户删除了通知, 其他非空值:用户点击了自定义action（仅限ios）
      //e.extras: 用户附加的{key:value}的对象
      // __DEV__ && console.log("Message Received. " + JSON.stringify(msg));

      //   if (msg.type && msg.type === "message" ) {
      //       try{
      //           msg = JSON.parse(msg.body);
      //       }catch (e) {

      //       }

      //   }

      //   if (msg.extras
      //       &&msg.extras.action_ok) {

      //           Alert.alert(
      //               msg.title,
      //               msg.body,
      //               [
      //                   {text: btnTextCancel, onPress: () => {}},
      //                   {text: btnTextView, onPress: () => {
      //                   /*
      //                       UrlNavigator.push(
      //                           {
      //                               url: msg.extras.action_ok,
      //                           }
      //                       );
      //                       */
      //                   }},
      //               ]
      //           );

      //   } else {
      //       if (!!msg.actionIdentifier===false || msg.actionIdentifier!=='removed') {
      //           Alert.alert(
      //               msg.title,
      //               msg.body
      //           );
      //       }

      //   }
  };

  clickCheck = () => {
    this.setState({
      IsTips: !this.state.IsTips,
    },()=>{
      let model ={
        IsTips:this.state.IsTips
      }
      CommonService.CurrentUserTipsPersonalInformation(model).then((response)=>{
        if(response.success){
            StorageUtil.removeKey(Key.UserInfo).then(() => {//清空userInfo缓存，再重新获取
              this._getUserCustomerInfo();
            })
         }
      }) 
    }) 
  }  
  _toSelfInfoMessage=()=>{
       return(
          <View style={{position:'absolute',top:-94, height:global.screenHeight, width:global.screenWidth}}>
            <View style={styles.container2}>
            <View style={styles.alertStyle}>
                <TouchableOpacity  onPress={()=>{this._yesClick()}}
                      style={{width:'100%',flexDirection:'row-reverse'}}>
                    <MaterialIcons
                        name={'close'}
                        size={26}
                        color={'#999'}
                    />
                </TouchableOpacity>
                <View style={{width:'100%',justifyContent:'center',alignItems:'center'}}>
                    <CustomText text={'差旅预订前，请问您是否已经维护好您的个人信息？'} style={{padding:6,fontSize:15,fontWeight:'bold'}}/>
                </View>
                <TouchableOpacity style={{flexDirection:'row'}}  onPress={() => { this.clickCheck() }}>
                    <CustomText text={'下次不再提示'} style={{paddingLeft:8,fontSize:13,color:Theme.theme}}/>
                    <MaterialIcons
                        name={_this.state.IsTips ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={_this.state.IsTips?Theme.theme:'#999'}
                        style={{marginTop:Util.Parse.isChinese()?-2:0}}
                    />
                </TouchableOpacity>
                <TouchableOpacity 
                          style={{height:40,alignItems:'center',justifyContent:'center',marginTop:10,borderTopWidth:1,borderColor:Theme.lineColor}}
                          onPress={()=>{this._yesClick()}}>
                          <CustomText  text='是' style={{fontSize:15,color:Theme.theme}}/>
                </TouchableOpacity>
                <TouchableOpacity 
                          style={{height:40,alignItems:'center',justifyContent:'center',borderTopWidth:1,borderColor:Theme.lineColor}}
                          onPress={()=>{this._noClick()}}
                          >
                          <CustomText  text='否，现在维护' style={{fontSize:15,color:Theme.theme}}/>
                </TouchableOpacity>
                </View>
            </View>
        </View>
       )
  }

  _yesClick(){
      this.setState({
        IsShowAlert:1
      },()=>{
        StorageUtil.saveKey(Key.ShowTipAlert,1);
      })
  }

  _noClick(){
      this.setState({
        IsShowAlert:1
      },()=>{
        StorageUtil.saveKey(Key.ShowTipAlert,1);
        this.push('PersonalInfo'); 
      }) 
  }

  _getData=()=>{
      // this.intervalID = setInterval(() => {
      //     CommonService.customerInfo().then(response => {
      //       if (response && response.success && response.data) {
      //           this.setState({
      //               runtimeEnv:response.data&&response.data.Addition&&response.data.Addition.SettingRuntimeEnv,
      //           })
      //       } else {
      //           // reject({ message: response.message || '获取客户信息失败' });
      //       }
      //     })
      // }, 1800000)
      // this._getruntimeEnv();
      this.backFromShopListener = DeviceEventEmitter.addListener(
        'goHome',  //监听器名 从改签或退票页过来的
        () => {
          this._getUserCustomerInfo(1);
        },
      );
      // AppState.addEventListener('change', this._handleAppStateChange)
      this.addPageFouces = this.props.navigation.addListener('willFocus', () => {
        // if (this.props.apply) {
        //   this.props.setApply(null);
        // }
        this.setState({});
      });
  }

  _currentUserMassInfo=()=>{
      CommonService.CurrentUserMassInfo().then(response=>{
         if(response&&response.success&&response.data){
              !response.data.PasswordRemind?
              null
              :
              response.data.PasswordRemind.IsForce?
              this.showAlertView(response.data.PasswordRemind.RemindText, () => {
                return (
                  ViewUtil.getAlertButton('马上修改', () => {
                    this.dismissAlertView();
                    this.push('ModifyPassword');
                  })
                )
              })
              :
              this.showAlertView(response.data.PasswordRemind.RemindText, () => {
                return (
                  ViewUtil.getAlertButton('暂不修改', () => {
                    this.dismissAlertView();
                  }, '马上修改', () => {
                    this.dismissAlertView();
                     this.push('ModifyPassword');
                  })
                )
              })
         }else{
           this.toastMsg(response&&response.message||'修改密码异常');
         }
      }).catch(error => {
         this.toastMsg(error.message);
      })
  }
  
  componentWillUnmount() {
    super.componentWillUnmount();
    // AppState.removeEventListener('change', this._handleAppStateChange);
    // this.addPageFouces && this.addPageFouces.remove();
    this.homeListener && this.homeListener.remove();
    this.pageEmit&& this.pageEmit.remove();
    this.deleteApplyListener&& this.deleteApplyListener.remove();
    this.backFromShopListener&& this.backFromShopListener.remove();
    this.letRefreshMassege&& this.letRefreshMassege.remove();
    this.timeoutIds && this.timeoutIds.forEach(id => clearTimeout(id));
    //移除监听
    // AliyunPush.removeListener(this.handleAliyunPushMessage);
    // AliyunPush.removeListener();
    //也可以用移除全部监听
    //AliyunPush.removeAllListeners()
  }
  // 通知的返回
  // _noticeCallBack = (result) => {
  //   if (result && result.extras && result.extras.ReferUrl) {
  //     this.push('Web', {
  //       title: '消息通知',
  //       url: result.extras.ReferUrl
  //     })
  //   } else {
  //     this._toNoticeCenter();
  //   }
  //   // alert('addNotificationListener' + JSON.stringify(result));
  // }

  // _handleAppStateChange = (nextAppstate) => {
  //   if (this.state.appState.match(/inactive|background/) && nextAppstate === 'active' && !this.state.isIngore) {
  //     this._getVersionUpGrade();
  //   }
  //   this.setState({ appState: nextAppstate });
  // }

  _getUserCustomerInfo = async (fromGoHome) => {
    const { ApproveOrigin,select } = this.state;
    const {apply,languageChange} = this.props
    try {
      // 1. 并行清理缓存（非阻塞）
      this._clearStorageCache();
      
      // 2. 并行获取用户和客户信息（关键优化点）
      const [userInfo, customerInfo] = await Promise.all([
        UserInfoDao.getUserInfo(),
        UserInfoDao.getCustomerInfo()
      ]);

      // 3. 批量更新状态，减少重渲染
      const _select = userInfo?.Preference?.UiLanguage === 'en-us' 
        ? { name: 'English', value: 'en' }
        : { name: '简体中文', value: 'zh' };

      const compSwitch = customerInfo.Setting.OrderMode === 1;
      
      // 设置审批来源
      Object.assign(ApproveOrigin, UserInfoUtil.ApproveOrigin(userInfo));

      // 批量更新状态
      this.setState({
        userInfo, 
        customerInfo,
        select: _select,
        compSwitchOnOff: customerInfo.Setting.OrderMode === 1 ? 1 : 2,
        IsShowAlert: 0
      });

      // 4. 异步执行后续操作，不阻塞主流程
      this._executePostUserInfoActions(userInfo, customerInfo, _select, select, languageChange, fromGoHome);

      // 5. 如果有申请单，异步查询旅客信息
      if (apply) {
        this._queryTravellers(apply.Id);
      }

    } catch (error) {
      // 统一的错误处理
      const errorMessage = error.message || this._getErrorMessage(error);
      this._detailError(errorMessage);
    }
  }
  // 清理缓存的辅助方法
  _clearStorageCache = () => {
    Promise.all([
      StorageUtil.removeKey(Key.CustomerInfo),
      StorageUtil.removeKey(Key.UserInfo)
    ]).catch(error => {
      console.log('清理缓存失败:', error);
    });
  }
  // 获取用户信息的后续操作（异步执行）
  _executePostUserInfoActions = async (userInfo, customerInfo, _select, select, languageChange, fromGoHome) => {
    try {
      // 设置综合开关
      const compSwitch = customerInfo.Setting.OrderMode === 1;
      this.props.loadComprehensiveSwitch(compSwitch);

      // 并行执行关键操作组
      const criticalTasks = [
        this._getAdList(),
        this.getBookTitle(customerInfo),
        this._getCompOrderData(),
        this.getCurrentUserMessageSummary()
      ];

      // 并行执行关键任务
      await Promise.all(criticalTasks);

      // 设置用户信息到redux
      const { setCustomer_userInfo } = this.props;
      setCustomer_userInfo(customerInfo, userInfo);

      // 保存logo到本地存储
      if (customerInfo?.Setting?.AppLogoUrl) {
        StorageUtil.saveKey(Key.UserLogo, customerInfo.Setting.AppLogoUrl);
      }

      // 延迟执行非关键操作（优化用户体验）
      setTimeout(() => {
        this._executeNonCriticalTasks(userInfo, customerInfo, _select, select, languageChange, fromGoHome);
      }, 300);

      // 异步执行推送标签绑定（不阻塞主流程）
      this._bindPushTags(userInfo, customerInfo);

    } catch (error) {
      console.log('执行用户信息后续操作失败:', error);
    }
  }
  // 非关键任务（延迟执行）
  _executeNonCriticalTasks = (userInfo, customerInfo, _select, select, languageChange, fromGoHome) => {
    try {
      // 检查支付列表
      this._getPaymentList();

      // 检查新功能引导
      this._getNew(customerInfo);

      // 语言同步
      if (_select.value !== select.value) {
        languageChange(_select, () => {});
      }

      // 添加旅客（如果需要）
      if (userInfo?.BookingMode === 0 && fromGoHome !== 1) {
        this._addPassenger(1);
      }
    } catch (error) {
      console.log('执行非关键任务失败:', error);
    }
  }

  // 绑定推送标签（完全异步）
  _bindPushTags = async (userInfo, customerInfo) => {
    try {
      const customerId = customerInfo?.Customer?.Id ? `C${customerInfo.Customer.Id}` : '';
      const EmployeeId = userInfo?.Id ? `E${userInfo.Id}` : '';
      const CustomerGroupId = customerInfo?.Setting?.CustomerGroupId ? `G${customerInfo.Setting.CustomerGroupId}` : '';

      // // 并行执行推送相关操作
      // await Promise.all([
      //   AliyunPush.bindTag(1, [customerId, EmployeeId, CustomerGroupId], ""),
      //   AliyunPush.listTags(1)
      // ]);

      console.log('推送标签绑定成功');
    } catch (error) {
      console.log('推送标签绑定失败:', error);
    }
  }

  // 统一的错误消息处理
  _getErrorMessage = (error) => {
    if (error.message?.includes('userInfo')) {
      return I18nUtil.translate('获取用户信息失败') + ',' + I18nUtil.translate('是否重新获取') + '?';
    } else if (error.message?.includes('customerInfo')) {
      return I18nUtil.translate('获取客户信息失败') + ',' + I18nUtil.translate('是否重新获取') + '?';
    }
    return error.message || '获取信息失败';
  }


  getCurrentUserMessageSummary = () => {
        const{userInfo} = this.state;
        CommonService.CurrentUserMessageSummary({ ReadStatus: 1 }).then(response => {
          if (response && response.success) {
            const sum = Object.values(response.data).reduce((acc, curr) => acc + curr, 0);
            this.setState({
              messageSummary: response.data,
              allMessNum:sum
            })
            // AliyunPush.setApplicationIconBadgeNumber(sum);
            this._navigationHeaderView = {
              title: (Util.Parse.isChinese()?'您好':'Hello') + (userInfo&&userInfo.Name?","+userInfo.Name:''),
              // hide:true,
              statusBar: {
                  backgroundColor: Theme.theme,
              },
              style: {
                  backgroundColor: Theme.theme,
              },
              titleStyle: {
                  color: 'white'
              },
              leftButton:<TouchableOpacity onPress={()=>{this.LeftClicked(true)}} style={{ }}>
                            <EvilIcons name={'navicon'} size={27} color={'#fff'} style={{paddingLeft:16}}/>
                              {/* <AntDesign name={'arrowleft'}
                                  size={20}
                                  style={[{ color:Theme.fontColor }]}
                              /> */}
                          </TouchableOpacity>,
              rightButton:<TouchableOpacity style={{padding:12}} onPress={()=>{this._toNoticeCenter()}}>
                            <MaterialCommunityIcons name={'bell-outline'} size={20} color={'#fff'} />
                            {
                              sum>0?
                              <View style={{position:'absolute',top:12,right:15,width:7,height:7,borderRadius:3.5,backgroundColor:'red'}}/>
                              :
                              null
                            }
                          </TouchableOpacity>            
        }
          }
        }).catch(error => {
          console.log(error);
        })
  }

  getBookTitle=(customerInfo)=>{
        let typeList = [
          {
              type: 1,
              name: '国内机票',
              typeId:1,
              hasAuth:Util.Encryption.clone(customerInfo&&customerInfo.Addition&&customerInfo.Addition.HasAirAuth)
          },
          {
              type: 7,
              name: '港澳台及国际机票',
              typeId:8,
              hasAuth:Util.Encryption.clone(customerInfo&&customerInfo.Addition&&customerInfo.Addition.HasInterAirAuth)
          },
          {
            type: 5,
            name: '火车票',
            typeId:2,
            hasAuth:Util.Encryption.clone(customerInfo&&customerInfo.Addition&&customerInfo.Addition.HasTrainAuth)
          },

          {
              type: 4,
              name: '国内酒店',
              typeId:4,
              hasAuth:Util.Encryption.clone(customerInfo&&customerInfo.Addition&&customerInfo.Addition.HasHotelAuth)
          },
          {
              type: 6,
              name: '港澳台及国际酒店',
              typeId:16,
              hasAuth:Util.Encryption.clone(customerInfo&&customerInfo.Addition&&customerInfo.Addition.HasInterHotelAuth)
          },
          
        ]
        this.setState({
          typeList:typeList
        })
  }

  _getNew=(customerInfo)=>{
    if (customerInfo&&customerInfo.Setting&&customerInfo.Setting.HomeGuideMobileBind) {
        CommonService.getUserInfo().then(userInfoRes => {
            if (userInfoRes && userInfoRes.success && userInfoRes.data) {
                if(!userInfoRes.data.Mobile){
                 this._guideMobileBind()
                }
            }
        }).catch(error => {
            this.toastMsg(error.message);
        })
    }
  }

  //获取综合订单数据
  _getCompOrderData = () => {
    const{keyWord2} = this.state;
    let model = 
        {
            Query: {
                Keyword: keyWord2
            },
            Pagination: {
                PageIndex: 1,
                PageSize: 30
            }
        }
    ComprehensiveService.RecentNotTravelOrders(model).then((response)=>{
       if(response.success && response.data){
          const commenArr = 
            response.data.ListData&&response.data.ListData.map(item => ({ 
                title: item.Departure +'-'+item.Destination ,
                MassOrderId: item.MassOrderId,
                BeginDate: item.BeginDate,
                EndDate: item.EndDate,
                data: item.Items,
                show:true
              })
            )
           this.setState({
            compSectionList:commenArr
           })
       }
    })   
  }

  /** 
   * 错误处理
   */
  _detailError = (error) => {
    let errorStr = error?error:'error!'
    this.showAlertView(errorStr, () => {
      return (ViewUtil.getAlertButton('取消', () => {
        /** 
         *  取消执行事件
         */
        this.dismissAlertView();
        this._btnLogOut();
      }, '确定', () => {
        /**
         *  确定执行时间
         */
        this.dismissAlertView();
        this._getUserCustomerInfo();
      }))
    })
  }

  /**
   *  退出登录
   */
  _btnLogOut = () => {
    this.showLoadingView();
    CommonService.logout().then(response => {
      if (response && response.success) {
        UserInfoDao.removeAllInfo().then(() => {
          this.hideLoadingView();
          // UMNative.profileSignOff();
          this.push('Init');
        }).catch(error => {
          this.hideLoadingView();
          this.toastMsg(error.message || '退出登录失败');
        })
      } else {
        this.hideLoadingView();
        this.toastMsg(response.message || '退出登录失败');
      }
    }).catch(error => {
      this.hideLoadingView();
      this.toastMsg(error.message || '退出登录失败');
    });
  }

  /**
   *  获取广告
   */
  _getAdList = () => {
    const { customerInfo} = this.state;
    let codeAdd = customerInfo&&customerInfo.Setting&&customerInfo.Setting.OrderMode===1?AdCodeEnum.MassOrderIndex : AdCodeEnum.home
    CommonService.GetAdStrategyContent(codeAdd).then(response => {
      if (response && response.success) {
        this.setState({
          noticeAdList: response.data
        })
      }
    }).catch(error => {

    })
  }

  _changeAdlist = ()=>{
    this.setState({
      isOpenAdList:!this.state.isOpenAdList,
    },()=>{
      DeviceEventEmitter.emit('home_close_open_adlist',this.state.isOpenAdList);
      StorageUtil.saveKeyId(FCM_SHOW_ADLIST,this.state.isOpenAdList?'on':'off');
    })
  }

  /** 
   * 检测是否绑定手机号
   */
  _guideMobileBind = () => {
    this.showAlertView('您尚未绑定手机号', () => {
      return (
        ViewUtil.getAlertButton('暂不绑定', () => {
          this.dismissAlertView();
        }, '绑定手机号', () => {
          this.dismissAlertView();
          this.push('BindMobile');
        })
      )
    })
  }

  /**
   *  获取待支付单
   */
  _getPaymentList = () => {
        let model = {
            query: {
                PaymentStatus: ["1"]
            }, 
            pagination: {
                PageIndex: this.state.page,
                PageSize: 10
            }
        }
        CommonService.PaymentAllList(model).then(response => {
            if (response && response.success) {
              const listData = response.data && response.data.ListData;
                if ( Array.isArray(listData) && response.data.ListData.length > 0 ) {
                  this.showAlertView('您有未支付订单，需要先完成支付', () => {
                    return (
                      ViewUtil.getAlertButton('稍后处理', () => {
                        this.dismissAlertView();
                      }, '去支付', () => {
                        this.dismissAlertView();
                        this.push('PayListScreen');
                      })
                    )
                  })
                }
            }else {
              this.toastMsg(response?.message || '获取数据失败');
            } 
        }).catch(error => {
            this.toastMsg(error.message || '获取数据异常');
        })
  }
  /**
   *  获取待支付单
   */

  /**
   *  升级检测
   */
  _getVersionUpGrade = () => {
    CommonService.versionUpgrade().then(response => {
      if (response && response.data && response.success) {
        let alerString = Util.Parse.isChinese()?
             '为了提供更好的用户体验，请点击“确认”对软件版本进行更新。\n版本更新内容：'+response.data.Content:
             'In order to provide a better user experience, please click "Confirm" to update the software version. \nVersion update content:'+response.data.Content
        let alertSr = Util.Parse.isChinese()?'温馨提示':'Notice'
        let huSr = Util.Parse.isChinese()?'忽略':'Ignore'
        let sjSr = Util.Parse.isChinese()?'去升级':'Update'
        if (response.data.Version > global.appBuildVersion) {
          if (response.data.ForceUpdate) {
            Alert.alert(
              alertSr,
              alerString || '提升用户体验',
              [
                {text: '确认', onPress: () => {
                    this.dismissAlertView();
                    this._downLoadNewVersion()
                }},
              ],
              {cancelable: false},
            );
          } else {
            Alert.alert(
              alertSr,
              alerString|| '提升用户体验',
              [
                {
                  text: huSr,
                  onPress: () => {
                    this.setState({
                      isIngore:true
                    },()=>{
                      // this._getUserCustomerInfo();
                    })
                    this.dismissAlertView();
                  },
                  style: 'cancel',
                },
                {text: sjSr, onPress: () => {
                   this.dismissAlertView();
                   this._downLoadNewVersion();
                }},
              ],
              {cancelable: false},
            );
          }
        }else{
          // this._getUserCustomerInfo();
        }
      }
    }).catch(error => {
      console.log(error);
      // this._getUserCustomerInfo();
    })
  }

  /** 
   * 下载版本
   */
  _downLoadNewVersion = () => {
    let url = Platform.OS === 'ios' ? itunceConnectUrl : tencentUrl;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        console.log('Can\'t handle url: ' + url);
      }
    }).catch(err => {
      this.toastMsg(err.message || '操作失败');
    });
  }

  // 前往通知中心
  _toNoticeCenter = () => {
    this.LeftClicked(false)
    this.push('NewNoticeCenterScreen',{messageSummary:this.state.messageSummary});
  }
 
  //接收子组件传来的数据改变openType状态，刷新UI
  LeftClicked(openType){
      this.setState({
          openType:openType
      });
  }

  _turnFinger=()=>{
    const { publickeyId } = this.state;
      if(publickeyId){
        this.showAlertView('确定关闭吗？',()=>{
            return ViewUtil.getAlertButton ('取消',()=>{
                this.dismissAlertView();
            },'确定',()=>{
                this.deleteBiometrics();
                this.dismissAlertView();
            })
        })
      }else{
          this.OpenBiometrics();
      }
  }

  getNavBarHeight() {
    if (Platform.OS === 'ios') {
      const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
      // 检查是否是全面屏iPhone
      const isFullScreeniPhone = 
        (screenHeight === 812 || screenWidth === 812) || // X, XS, 11 Pro, 12 Mini, 13 Mini
        (screenHeight === 844 || screenWidth === 844) || // 12, 12 Pro, 13, 13 Pro, 14
        (screenHeight === 852 || screenWidth === 852) || // 14 Pro
        (screenHeight === 896 || screenWidth === 896) || // XR, XS Max, 11, 11 Pro Max
        (screenHeight === 926 || screenWidth === 926) || // 12 Pro Max, 13 Pro Max, 14 Plus
        (screenHeight === 932 || screenWidth === 932);   // 14 Pro Max
  
      if (isFullScreeniPhone) {
        return 88-44-20; // 全面屏iPhone（带刘海）
      } else {
        return 0; // 常规 iPhone
      }
    }
    return 0; // Android
  }

  _toMessage=()=>{
      this.push('NewNoticeCenterScreen',{messageSummary:this.state.messageSummary});
  }

  renderBody() {
    const {userInfo, customerInfo, compSwitchOnOff, select,notifySelect,IsHideChangePassword,fingerLogin,publickeyId,isTravelOrder,allMessNum} = this.state;
    const {setComp_Id} = this.props;
    let HasTravelApplyAuth =  customerInfo&&customerInfo.Addition.HasTravelApplyAuth
    let string = Platform.OS=='android'?'指纹登录':'指纹或面部登录'
    return (
      <View style={styles.container}>
          <Drawer type='overlay'
                  side='left'
                  content={//左侧 菜单列表
                    <View style={{marginTop:-64,flexDirection:'row',width:global.screenWidth*0.7,height:global.screenHeight,}}>
                        <ScrollView Add commentMore actions
                                  style={{backgroundColor:Theme.normalBg,width:global.screenWidth*0.7,height:global.screenHeight,marginTop:0}} 
                                  keyboardShouldPersistTaps='handled' 
                                  showsVerticalScrollIndicator={false}
                        >
                          <View style={{flexDirection:'row',paddingHorizontal:15,marginTop:50}}>
                            <Image source={require('../../res/Uimage/myself/user_name.png')} style={{width:20,height:20}}/>
                            <Text style={{fontSize:16,color:Theme.fontColor,marginLeft:10}}>{I18nUtil.translate('您好') + ',' + (userInfo ? userInfo.Name : '')}</Text>
                          </View>
                          <View style={{backgroundColor:'#fff',margin:8,borderRadius:8}}>
                            {
                              barArr2.map((item,index)=>{
                                  return(
                                    (!HasTravelApplyAuth) && index==2 || compSwitchOnOff == 2 && index==0
                                      ? 
                                      null
                                      :
                                      <TabView name={item.name} key={index} img={item.require} callBack={()=>{
                                          this.LeftClicked(false)
                                          if(index==0){
                                          this._getCompList();
                                          }else 
                                          if(index==1){
                                            this.push('Approval',{customerInfo});
                                          }else if(index==2){
                                            this.push('ApplicationListScreen');
                                          }else if(index==3){
                                            this.push('Personal');
                                          }else{
                                            this.push('PayListScreen');
                                          }
                                      }}/>
                                  )
                              })
                            }
                          </View>
                          <View style={{backgroundColor:'#fff',margin:8,borderRadius:8}}>
                              <TouchableOpacity style={styles.btnStyle} onPress={this._toMessage}>
                                  <View style={{flexDirection:'row',alignItems:'center'}}>
                                    <Image source={require('../../res/Uimage/myself/bell.png')} style={{width:20,height:20}}/>
                                    <CustomText text={'消息通知'} style={{marginLeft:10}}></CustomText>
                                  </View>
                                  <View style={{flexDirection:'row',alignItems:'center'}}>
                                    {allMessNum? <View style={{minHeight:16, minWidth:16, backgroundColor:Theme.redColor,borderRadius:8,color:'#fff',alignItems:'center',justifyContent:'center'}}>
                                       <CustomText text={allMessNum>=99?"99+":allMessNum} style={{fontSize:10,color:'#fff'}} />
                                    </View>:null}
                                    <AntDesign name={'right'} size={16} color={Theme.assistFontColor} />
                                  </View>
                              </TouchableOpacity>
                              <View style={styles.btnStyle}>
                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                  <Image source={require('../../res/Uimage/myself/translate.png')} style={{width:20,height:20}}/>
                                  <CustomText text={'多语言'} style={{marginLeft:10}}></CustomText>
                                </View>
                                <TouchableHighlight underlayColor='transparent' onPress={this._changeLanguage}>
                                              <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                                  <View style={{ backgroundColor: select.value === 'zh' ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                                      <CustomText text='中' style={{ color: select.value === 'zh' ?  "white" : Theme.commonFontColor }} />
                                                  </View>
                                                  <View style={{ backgroundColor: select.value === 'en' ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                                      <CustomText text='EN' style={{ color:select.value === 'en' ? "white":Theme.commonFontColor }} />
                                                  </View>
                                              </View>
                                </TouchableHighlight>
                              </View>
                              <View style={styles.btnStyle}>
                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                  <Image source={require('../../res/Uimage/myself/translate.png')} style={{width:20,height:20}}/>
                                  <CustomText text={'通知语言'} style={{marginLeft:10,flexWrap:'wrap',width:120}}></CustomText>
                                </View>
                                <TouchableHighlight underlayColor='transparent' onPress={this._changeLanguageNotif}>
                                              <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                                  <View style={{ backgroundColor: notifySelect.value === 'zh' ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                                      <CustomText text='中' style={{ color:notifySelect.value === 'zh' ?  "white": Theme.commonFontColor }} />
                                                  </View>
                                                  <View style={{ backgroundColor: notifySelect.value === 'en' ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                                      <CustomText text='EN' style={{ color:notifySelect.value === 'en' ?  "white": Theme.commonFontColor }} />
                                                  </View>
                                              </View>
                                </TouchableHighlight>
                              </View>
                              <View style={styles.btnStyle}>
                                  <View style={{flexDirection:'row',alignItems:'center'}}>
                                      <Image source={require('../../res/Uimage/myself/_finger.png')} style={{width:20,height:20}}/>
                                      <CustomText text={string} style={{marginLeft:10,flexWrap:'wrap',width:120}}></CustomText>
                                  </View>
                                  <TouchableHighlight underlayColor='transparent' onPress={this._turnFinger}>
                                              <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                                  <View style={{ backgroundColor: fingerLogin ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                                      <CustomText text='开' style={{ color:fingerLogin ?  "white": Theme.commonFontColor }} />
                                                  </View>
                                                  <View style={{ backgroundColor: !fingerLogin ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                                      <CustomText text='关' style={{ color: !fingerLogin ? "white" : Theme.commonFontColor }} />
                                                  </View>
                                              </View>
                                  </TouchableHighlight>
                              </View>
                              {
                              // IsHideChangePassword? null: 
                              <TabView name={'修改密码'} img={require('../../res/Uimage/myself/password.png')} callBack={()=>{
                                  this.LeftClicked(false)
                                  this.push('ModifyPassword')
                              }}/>
                              }
                          </View>
                          <View style={{backgroundColor:'#fff',margin:8,borderRadius:8}}>
                          <View style={styles.btnStyle}>
                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                  <Image source={require('../../res/Uimage/myself/like.png')} style={{width:20,height:20}}/>
                                  <CustomText text={'个性化推荐'} style={{marginLeft:10}}></CustomText>
                                </View>
                                <TouchableHighlight underlayColor='transparent' onPress={this._changeAdlist}>
                                              <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                                  <View style={{ backgroundColor: this.state.isOpenAdList ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                                      <CustomText text={Util.Parse.isChinese?'开':'On'} style={{ color:this.state.isOpenAdList ? "white": Theme.commonFontColor }} />
                                                  </View>
                                                  <View style={{ backgroundColor: !this.state.isOpenAdList  ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                                      <CustomText text={Util.Parse.isChinese?'关':'Off'} style={{ color: !this.state.isOpenAdList ? "white" : Theme.commonFontColor }} />
                                                  </View>
                                              </View>
                                </TouchableHighlight>
                                
                              </View>
                            {
                              barArr1.map((item,index)=>{//关于我们，呼叫客服
                                  return(
                                      <TabView name={item.name} key={index} img={item.require} callBack={()=>{
                                        if(index==0){
                                            this._call()
                                        }else{
                                          this.LeftClicked(false)
                                          this.push('AboutUs')
                                        }
                                      }}/>
                                  )
                              })
                            }
                          </View>
                          <View style={{backgroundColor:'#fff',margin:8,borderRadius:8}}>
                            {
                              barArrLast.map((item,index)=>{//退出 注销
                                  return(
                                      <TabView name={item.name} key={index} img={item.require} red={true} callBack={()=>{
                                        if(index==0){
                                          this.LeftClicked(false)
                                          this._btnLogOut()
                                        }else{
                                          this.LeftClicked(false)
                                          this.push('CancalAccount');
                                        }
                                      }}/>
                                  )
                              })
                            }
                          </View>
                          {
                            customerInfo&&customerInfo.Setting&&customerInfo.Setting.ServiceEmail?
                              <View style={{justifyContent:'center',flexDirection:'row',paddingHorizontal:20,alignItems:'center'}}>
                                  <Image source={require('../../res/Uimage/Email.png')} style={{height:16, width:16,tintColor:Theme.theme}}></Image>
                                  <View >
                                    <CustomText text={customerInfo.Setting.ServiceEmail} style={{color:Theme.theme,fontSize:14,marginLeft:5}}/>
                                  </View>
                              </View>   
                            :null
                          }
                          <View style={{height:66}}></View>
                        </ScrollView>
                    </View>
                  } 
                  tapToClose={true}
                  panOpenMask={0.6}
                  panDrawerOffset={0.2}
                  panCloseMask={0.3}
                  closedDrawerOffset={0}
                  open={this.state.openType}
                  onClose = {()=>this.LeftClicked(false)}//收起时将open状态改为false
                  style={drawerStyles}
                  tweenHandler={(ratio)=>({main:{opacity:(2-ratio)/2}})}
                  useInteractionManager={true} // 等待交互完成后再渲染，减少卡顿Add commentMore actions
                  optimizeDrawer={true} // 如果Drawer组件支持此属性，开启优化
                  >
                  {/* <View style={{height:this.getNavBarHeight(),backgroundColor:Theme.theme}}></View>
                {
                    <View style={{width:global.screenWidth,height:44,backgroundColor:Theme.theme,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                        <TouchableOpacity underlayColor='transparent' onPress={()=>{this.LeftClicked(true)}}>
                          <EvilIcons name={'navicon'} size={27} color={'#fff'} style={{paddingLeft:16}}/>
                        </TouchableOpacity>
                        <CustomText style={{fontSize:16,color:'#fff'}} text={(Util.Parse.isChinese()?'欢迎':'Hello') + (userInfo&&userInfo.Name?","+userInfo.Name:'')}/>
                        <TouchableOpacity underlayColor='transparent' onPress={()=>{
                                this._toNoticeCenter()
                            }}>
                              <AntDesign name={''} size={30} color={'#fff'} style={{paddingRight:16}}/>
                        </TouchableOpacity>
                  </View>  
                }  */}
                {
                  this._mainUI()
                }  
          </Drawer> 
     </View>
    );
  }


  _mainUI=()=>{
    const {compSectionList,keyWord2,noticeAdList,IsAddShow,userInfo,IsShowAlert,isTravelOrder,compSwitchOnOff} = this.state;
    const { width, height } = Dimensions.get('window');
    const isIPhone678 = Platform.OS === 'ios' && width === 375 && height === 667;
    const isIPhonePlus = Platform.OS === 'ios' && width === 414 && height === 736;
    let _height = Platform.OS=='android'?185: (isIPhone678 || isIPhonePlus) ? 130 : 185;
    return(
      <View style={{flex:1,backgroundColor: Theme.normalBg2,}}>
        <View style={{width:global.screenWidth,height:global.screenHeight-_height }}>
          <NoticeView/>
         <Image source={Util.Parse.isChinese() ? require('../../res/Uimage/_mgBg.png') : require('../../res/Uimage/_mgBgEn.png')}  style={{ width:global.screenWidth,height:110}}/>
          {/* {
            (!userInfo.Preference || !userInfo.Preference.IsPersonalInformation)&& IsShowAlert!=1 ? this._toSelfInfoMessage() : null
          } */}
          <View>
              <View style={styles.header_view1}>
                  <TouchableOpacity style={{justifyContent:'center',alignItems:'center'}} 
                                    onPress={() => {
                                      if (!isTravelOrder) {
                                        this.setState({ isTravelOrder: true })
                                      }
                                    }} >
                      <CustomText text='近期行程' style={{ fontWeight: isTravelOrder ? 'bold': 'normal' ,fontSize:isTravelOrder ?15:14, color:isTravelOrder?Theme.theme:Theme.commonFontColor,paddingVertical:13}} />
                      <View style={{width:global.screenWidth/2,height:2,backgroundColor: isTravelOrder ? Theme.theme : 'transparent' }}></View>
                  </TouchableOpacity>
                  <TouchableOpacity style={{justifyContent:'center',alignItems:'center'}} 
                                    onPress={() => {
                                      if (isTravelOrder) {
                                        this.setState({ isTravelOrder: false })
                                      }
                                      if (this.props.apply) {
                                         this.props.setApply(null);
                                      }
                                    }} >
                      <CustomText text='新建订单' style={{ fontWeight: isTravelOrder ? 'normal' : 'bold',fontSize:isTravelOrder ?14:15, color:isTravelOrder?Theme.commonFontColor:Theme.theme,paddingVertical:13}}  />
                      <View style={{width:global.screenWidth/2,height:2, backgroundColor: isTravelOrder ? 'transparent' : Theme.theme }}></View>
                  </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1 }}>
                          {
                            // compSwitchOnOff && compSwitchOnOff!=2?
                            this._travelOrder()
                            // :
                            // this._renderTravelOrder()
                          }
                  {
                      this._addNewTravel()//新建订单
                  }
            </View>
        </View>
        { 
           isTravelOrder?
           ViewUtil.getThemeButton2('查看全部订单',this._getCompList)
           :
           ViewUtil.getThemeButton2('下一步',this._nextClick) 
        }
       
        {/* 广告弹框 //=*= */}
        {/* {
            noticeAdList&&noticeAdList.length>0&&IsAddShow&& !this.isShowHomeAdd?
                this._testAlert()
            :null
        } */}
        {
            (!userInfo?.Preference?.IsPersonalInformation ?? true) && 
            IsShowAlert != 1 && this.ShowTipAlert &&
            this._toSelfInfoMessage()//完善信息弹窗
        }
      </View>
    )
}

_travelOrder=()=>{
  const { isTravelOrder, compSectionList,userInfo } = this.state;
  if (!isTravelOrder ) return null;
  return(
    <View style={{flex:1}}>
       <CompCreateJourneyView  otw_this={this} compSectionList={compSectionList} userInfo={userInfo}/>
    </View>
  )

}

_addNewTravel=()=>{
  const { isTravelOrder,customerInfo,userInfo,employees,travellers,ReferenceEmployee,ProjectItem,typeList,businessCategory,ReferenceEmployeeId,selectTap,ApproveOrigin} = this.state;
  const { apply } = this.props;
  if (isTravelOrder) return null;
  let HasTravelApplyAuth =  customerInfo&&customerInfo.Addition.HasTravelApplyAuth

  // 合并员工和旅客数据
  const allPersons = [
    ...employees.map(item => ({ ...item, type: 'employee' })),
    ...travellers.map(item => ({ ...item, type: 'traveller' }))
  ];
  return(
    <ScrollView style={{flex:1,backgroundColor:Theme.normalBg}}>
      { HasTravelApplyAuth ? this.choosePlay() : null}
      <View style={{backgroundColor:'#fff',marginHorizontal:10,padding:5,borderRadius:6,marginTop:10}}>
          <TouchableOpacity onPress={this._addPassenger.bind(this, 1,true)}
              style={{paddingHorizontal:14,paddingVertical:10,flexDirection:'row',justifyContent:'space-between',backgroundColor:'#fff'}}>
              <TitleView2 title={userInfo.BookingMode===0?'为本人预订':'选择出行人'}  style={{}}></TitleView2>
              <AntDesign name={'adduser'} size={20} color={Theme.theme} />
          </TouchableOpacity>
          {
              <FlatList 
                  style={{marginHorizontal:10}}
                  data={employees}
                  keyExtractor = {(item, index) => index }
                  showsVerticalScrollIndicator={false}
                  renderItem={this._emRenderRow}
              />
          }
          {
              <FlatList 
                  style={{marginHorizontal:10}}
                  data={travellers}
                  keyExtractor = {(item, index) => index }
                  showsVerticalScrollIndicator={false}
                  renderItem={this._trRenderRow}
              />
          }
      </View>
      {(!employees.length && !travellers.length)?null:
        <View style={{backgroundColor:'#fff',marginTop:10,marginHorizontal:10,padding:5,borderRadius:6}}>
              {
                  <TouchableHighlight underlayColor='transparent' onPress={this._approveClick.bind(this)}>
                      <View style={styles.section}>
                          <View style={{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap'}}>                     
                          <TitleView2 title={'差标及审批流'}  style={{}}></TitleView2>
                          <CustomText style={{ marginLeft:10,fontSize:14,color:Theme.commonFontColor,}} text={ReferenceEmployee&&ReferenceEmployee.Name} />
                          </View>
                          <AntDesign name={'right'} size={16} color={Theme.theme} />
                      </View>
                  </TouchableHighlight> 
              }
              {
                customerInfo?.Setting?.IsHiddenProject?null:
                <View style={{paddingHorizontal:5}}>
                    <DepartView
                        ApproveOrigin={ApproveOrigin}
                        customerInfo={customerInfo}
                        fromCreateApply={false}
                        CustomerId={ReferenceEmployee&&ReferenceEmployee.CustomerId}
                        approveOriginCallBack={()=>{
                            // this.getApprover()
                            // this._objectClick()
                        }}
                    />
                </View>
              }
      </View>}
      <View style={{backgroundColor:'#fff',padding:20,marginHorizontal:10,borderRadius:6,marginTop:10}}>
            {/* <CustomText text={'选择预订业务'} style={{fontSize:14,paddingBottom:10,fontWeight:'500',marginTop:10}}></CustomText> */}
            <TitleView2 title={'选择预订业务'}  style={{paddingBottom:10}}></TitleView2>
            <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                {
                    typeList.map((item, index)=>{
                        return(
                            <View key={index}>
                                {
                                    (!apply && item.hasAuth) || (apply&&businessCategory&item.typeId)?//没有申请单按Setting配置显示，有申请单按申请单业务显示
                                    <TouchableOpacity key={index} onPress={()=>{
                                        this.setState({
                                            selectTap:item.type ? item.type : selectTap
                                        })
                                    }}>
                                      <View style={[styles.tapStyle,{borderColor:selectTap==item.type?Theme.theme:Theme.promptFontColor,backgroundColor:selectTap==item.type?Theme.greenBg:'#fff'}]}>
                                          <CustomText style={{fontSize:13, padding:10,color:selectTap==item.type?Theme.theme:Theme.commonFontColor }} color={Theme.darkColor} text={item.name} />
                                      </View>
                                    </TouchableOpacity>
                                    :null
                                }
                            </View>
                        )
                    })
                }
            </View>
          </View> 
    </ScrollView>
  )
}

//删除已选出差人
_deleteChoose =(item)=>{
  const {employees, travellers, ReferenceEmployeeId,userInfo} = this.state;
  if (item.item?.PassengerOrigin?.Type === 1 && 
      ReferenceEmployeeId === item.item.PassengerOrigin.EmployeeId && 
      ReferenceEmployeeId !== userInfo.Id) {
          this.setState({
          ReferenceEmployeeId:null,
          ReferenceEmployeeName:null,
          ReferenceEmployee:null
          })
  }
  let employeesArr = JSON.parse(JSON.stringify(employees))//序列化反序列化法拷贝
  let employeesArr2 = employeesArr.filter(isMinNum);
  let travellersArr = JSON.parse(JSON.stringify(travellers))//序列化反序列化法拷贝
  let travellersArr2 = travellersArr.filter(isMinNum);
  function isMinNum(data_item) {
     return (JSON.stringify(data_item)  != JSON.stringify(item.item));
  }
   this.setState({
       employees:employeesArr2,
       travellers:travellersArr2
   })
}

  /**
   * 项目出差
   */
  // _objectClick = () =>{
  //   const { ReferenceEmployee } = this.state
  //   this.push('ProjectScreen', {
  //       title: '选择项目',
  //       CustomerId: ReferenceEmployee&&ReferenceEmployee.CustomerId,
  //       callBack: (obj) => {
  //           this.setState({
  //               ProjectId:obj.Id,
  //               ProjectName:obj.Name,
  //               ProjectItem:obj
  //           })
  //       }
  //   });
  // }

      /**
     * 项目出差
     */
    _objectClick = () =>{
      const {ApproveOrigin}= this.state;
      // this.push('ProjectScreen', {
      //     title: '选择项目',
      //     callBack: (obj) => {
              this.setState({
                  ProjectId:ApproveOrigin.ProjectId,
                  ProjectName:ApproveOrigin.ProjectName,
                  ProjectItem:ApproveOrigin
              },()=>{
                  this._checkTravellers();//检查出差人
              })
      //     }
      // });
    }

  /**
   * 参考差标及审批流
   */
  _approveClick = () =>{
    const { employees, userInfo } = this.state;
    // let _myfilterEmployee = []; //分离出员工
    // UserInfoUtil.filterEmployee(employees, _myfilterEmployee);
    this.push('EmployeesScreen',{
        employees,
        userInfo,
        callBack:(obj)=>{
            this.setState({
                ReferenceEmployeeId:obj.PassengerOrigin?obj.PassengerOrigin.EmployeeId:obj.Id,
                ReferenceEmployeeName:obj.Name,
                ReferenceEmployee:obj,
                //重选参考人清空项目
                ProjectId:null,
                ProjectName:null,
                ProjectItem:null
            })
        }
    });
  }

// _emRenderRow=({item,index})=>{//员工
//   return(
//       <AddpersonView employeesItem={item} callBack={this._deleteChoose} editCallBack={()=>this._editPerson(item,index)}/> 
//   )
// }
_emRenderRow=({item,index})=>{//员工
  return(
      <AddpersonView employeesItem={item} callBack={this._deleteChoose} editCallBack={()=>this._editPerson(index,1)}/>
  )
}
_trRenderRow=({item,index})=>{//常旅客
  return(
      <AddpersonView employeesItem={item} callBack={this._deleteChoose} editCallBack={()=>this._editPerson(index,2)}/>
  )
}

_editPerson= (index,type)=>{
  const { employees,travellers,ReferenceEmployeeId } = this.state;
  let data = null;
  if (type === 1) {
      data = employees[index];
      let model={
          ReferenceEmployeeId:ReferenceEmployeeId,
          ReferencePassengerId:data&&data.PassengerOrigin&&data.PassengerOrigin.EmployeeId,
      }
      CommonService.customerInfo(model).then(response => {
          if(response&&response.success&&response.data){
              this.push( 'CompEditPassengerScreen', {
                  passenger: data, 
                  customerInfo:response.data,
                  index: type, 
                  from: 'em_presonal',
                  callBack: (obj) => {
                    if (data.cusInsurances) {
                        obj.cusInsurances = data.cusInsurances;
                    }
                    if (type === 1) {
                        employees[index] = obj;
                        if(obj.Mobile && obj.CertificateNumber && (obj.SexDesc || obj.Sex)){
                            obj.highLight=false
                        }
                    } else {
                        travellers[index] = obj;
                    }
                    this.setState({});
                    }
               });
          }
      }).catch(error => {
          this.toastMsg(error.message);
      })     
  } else {
      data = travellers[index];
      let customerInfo = this.props.customerInfo_userInfo.customerInfo;
      this.push( 'CompEditPassengerScreen', {
          passenger: data, 
          customerInfo:customerInfo,
          index: type, 
          from: 'em_presonal',
          callBack: (obj) => {
            if (data.cusInsurances) {
                obj.cusInsurances = data.cusInsurances;
            }
            if (type === 1) {
                employees[index] = obj;
                if(obj.Mobile && obj.CertificateNumber && (obj.SexDesc || obj.Sex)){
                    obj.highLight=false
                }
            } else {
                travellers[index] = obj;
            }
            this.setState({});
            }
       });   
  }
}

_addPassenger = (index,index2) => {
  const { userInfo, employees } = this.state;
  if(typeof(userInfo.Permission)=="undefined"){this.toastMsg('获取用户信息中，请稍等'); return}
  if(userInfo.BookingMode===0 && index===1){
      let CertifiList = JSON.parse(userInfo.Certificate)
      let user = {
          IsEmployee:true,
          SerialNumber:userInfo.SerialNumber,
          DepartmentId:userInfo.DepartmentId,
          DepartmentName:userInfo.Department&&userInfo.Department.Name,
          RulesTravelId:userInfo.RulesTravelId,
          RulesTravelName:userInfo.RulesTravel&&userInfo.RulesTravel.Name,
          RulesTravelDetails:userInfo.RulesTravel&&userInfo.RulesTravel.RuleTravelDetails,
          CardTravellerList:userInfo.CardTravellerList,
          HotelCardTravellerList:userInfo.HotelCardTravellerList,
          Id:userInfo.Id,
          Name:userInfo.Name,
          Gender:userInfo.Sex,
          Mobile:userInfo.Mobile,
          Certificates:CertifiList,
          Birthday:userInfo.Birthday,
          Email:userInfo.Email,
          Surname:userInfo.LastName,
          GivenName:userInfo.FirstName,
          IsVip:userInfo.IsVip,
          PassengerType:1,
          PassengerOrigin:{Type:1,EmployeeId:userInfo.Id,TravellerId:0}, 
          Addition:userInfo.Addition,
          CostCenter:null,//
          SeqNo:0,//
          ApprovalData:{},//
          CostCenterRequired:false,//
          EmailRequired:false,//
          OrderId:0,//  
          NationalName:CertifiList&&CertifiList[0]&&CertifiList[0].NationalName,
          Nationality:CertifiList&&CertifiList[0]&&CertifiList[0].Nationality,
          NationalCode:CertifiList&&CertifiList[0]&&CertifiList[0].NationalCode,
          CertificateType:CertifiList&&CertifiList[0]&&CertifiList[0].TypeDesc,
          CertificateNumber:CertifiList&&CertifiList[0]&&CertifiList[0].SerialNumber,
          CertificateExpire:CertifiList&&CertifiList[0]&&CertifiList[0].Expire,
          IssueNationCode:CertifiList&&CertifiList[0]&&CertifiList[0].IssueNationCode,
          IssueNationName:CertifiList&&CertifiList[0]&&CertifiList[0].IssueNationName,
          SexDesc:userInfo.Sex === 1?'男':'女',

      }
      if(employees.length>0 && index2){
          this.toastMsg('已添加本人');
      }else{
          employees.push(user);
          this.setState({});
      }
  }else{
      this._addPerson(index)
  }
}

/**
 * 添加员工或常旅客方法
 */
_addPerson=(index)=>{
  const { employees, travellers,ReferenceEmployeeId,userInfo } = this.state;
  this.push('PassengerViewScreen', {
      title: index === 1 ? '选择其他员工' : '选择常用旅客',
      // from:index === 1 ?1:0,
      from:'comp_traveller',
      fromComp:1,
      passengers: employees.concat(travellers),  
      callBack: (passengers) => {
          if(passengers[0]&&passengers[0].CertificateType){
              let  Certificate = {
                  Expire: passengers[0].CertificateExpire,
                  ImageUrl: null,
                  IssueNationCode:  passengers[0].IssueNationCode,
                  IssueNationName: passengers[0].IssueNationName,
                  NationalCode: passengers[0].NationalCode,
                  NationalName: passengers[0].NationalName,
                  SerialNumber: passengers[0].CertificateNumber,
                  Type: Util.Read.certificateType(passengers[0].CertificateType),
                  TypeDesc: passengers[0].CertificateType,
              }
              passengers[0].Certificates = [Certificate]
          }
          let employeesArr = [];
          let travellersArr = [];
          passengers&&passengers.map((item)=>{
              let Certificate = item.Certificates?item.Certificates[0]:item.CertificateList?item.CertificateList[0]:null
              let Certificatelist = item.Certificates?item.Certificates:item.CertificateList?item.CertificateList:null
              if(Certificate){
                  item.CertificateType = Certificate.TypeDesc;
                  item.CertificateId = Certificate.Type;
                  item.CertificateNumber = Certificate.SerialNumber;
                  item.CertificateExpire = Certificate.Expire;
                  item.NationalName = Certificate.NationalName;
                  item.NationalCode = Certificate.NationalCode;
                  item.IssueNationName = Certificate.IssueNationName; 
                  item.IssueNationCode = Certificate.IssueNationCode;
                  item.Certificate =  JSON.stringify(Certificatelist);
              }
              if(item.PassengerOrigin&&item.PassengerOrigin.Type==1){
                  employeesArr.push(item)
              }else{
                  travellersArr.push(item)
              }
          })
          this.setState({
              employees:employeesArr,
              travellers:travellersArr,
          });
          if((travellersArr.length>0 && employeesArr.length===0) || (employeesArr.length===1 && employeesArr[0].PassengerOrigin.EmployeeId===userInfo.Id)){
             this.setState({
                ReferenceEmployeeId:userInfo.Id,
                ReferenceEmployeeName:userInfo.Name,
                ReferenceEmployee:userInfo
             })
          }else{
              this.setState({
                  ReferenceEmployeeId:null,
                  ReferenceEmployeeName:null,
                  ReferenceEmployee:null
              })
          }
          let PassengerId = employeesArr&&employeesArr.length>0 ? employeesArr[employeesArr.length-1].PassengerOrigin.EmployeeId: null
          let model = {
              ReferenceEmployeeId:ReferenceEmployeeId,
              ReferencePassengerId:PassengerId,
          }
          CommonService.customerInfo(model).then(response => {
              if(response&&response.success&&response.data){
                      this.setState({
                      customerInfo:response.data
                      })
              }else{
                  this.toastMsg('获取数据异常');
              }
              }).catch(error => {
                  this.toastMsg(error.message);
          }) 
          this.setState({});
      }
  })
}
choosePlay=()=>{
  const { applyNum } = this.state;
  return(
    <View style={{marginHorizontal:10,backgroundColor:'#fff',borderRadius:6,marginTop:10}}>
        <TouchableOpacity 
            style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,paddingVertical:15,flex:1,borderRadius:6}}
            onPress={()=>{ this._chooseApplybtn() }}
        >
          <TitleView2 title={'选择出差单'}  style={{}}></TitleView2>
          <AntDesign name={'right'} size={16} color={Theme.theme} />
        </TouchableOpacity>
        {applyNum? 
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColorl:'red',marginHorizontal:20,borderTopWidth:1,paddingVertical:15,borderColor:Theme.lineColor}}>
            <CustomText text={applyNum} style={{fontSize:14,color:Theme.commonFontColor}}></CustomText>
            <TouchableOpacity style={{alignItems:'center'}}
                  onPress={()=>{
                        this.props.setApply(null);
                        this.setState({
                            applyNum:null
                        })
                  }}
            >
               <AntDesign name="delete" size={18} style={{color:Theme.theme}}></AntDesign>
            </TouchableOpacity>
          </View>
        :null}
    </View>
  )
}
/**
 * 选择出差申请单
 */
_chooseApplybtn = () => {
    const {typeList} = this.state;
    this.push('ApplicationSelect',{
        from:'creatComp',
        callBack:(obj,arrivalCityDisplay,goCityDisplay,BeginTime,EndTime,selectApplyItem)=>{
            selectApplyItem&&selectApplyItem.BusinessCategory
            let CategoryList = []
            let CategoryList2 = []
            typeList&&typeList.map((item, index)=>{
                if(selectApplyItem&&selectApplyItem.BusinessCategory&item.typeId){
                    CategoryList.push(item.type);
                    CategoryList2.push(item.typeId);
                }
            }) 
            this._queryTravellers(obj.Id);             
            this.setState({
                applyNum:obj.SerialNumber,
                selectTap:CategoryList[0],
                category:CategoryList2[0],
                businessCategory:selectApplyItem&&selectApplyItem.BusinessCategory?selectApplyItem.BusinessCategory:obj.BusinessCategory,
                arrivalCityDisplay:arrivalCityDisplay,
                goCityDisplay:goCityDisplay,
                selectApplyItem:selectApplyItem,
            })
        }
    });
}
_queryTravellers=(applyId)=>{
  let model = {
      Query: {
          ApplyId:applyId
          },
          Pagination: {
          PageIndex: 1,
          PageSize: 20
      }          
  }
  ComprehensiveService.MassOrderQueryTravellers(model).then(response => {
      this.hideLoadingView()
      if (response && response.success) {
          if (response.data&&response.data.ListData) {
              response.data.ListData.map((item)=>{
                  if(item.Certificates){
                      // let obj = item.Certificates[0];
                      let obj = Array.isArray(item.Certificates) && item.Certificates.length > 0 ? item.Certificates[0] : null;
                      if (obj) {
                          item.CertificateType = obj.TypeDesc;
                          item.CertificateId = obj.Type;
                          item.CertificateNumber = obj.SerialNumber;
                          item.CertificateExpire = obj.Expire;
                          item.NationalName = obj.NationalName;
                          item.NationalCode = obj.NationalCode;
                          item.IssueNationName = obj.IssueNationName; 
                          item.IssueNationCode = obj.IssueNationCode;
                          item.Gender =  obj.Sex 
                      }
                  }
              })
              this.setState({
                  employees:response.data.ListData
              })
          }
      }
  }).catch(error => {
      this.hideLoadingView();
      this.toastMsg(error.message || '加载数据失败请重试');
  })
}

    /**
     * 确定事件
     **/
_nextClick=()=>{
    const {employees, travellers, selectTap, ReferenceEmployeeId,ReferenceEmployee,userInfo,customerInfo,ApproveOrigin} = this.state; 
    const {onClickSure,setComp_Id,setReferenceEmployee,apply} = this.props;
    onClickSure(true);
    setComp_Id(null);

    if(userInfo.BookingMode==0 && apply){
        let travellers = employees;
        let traveller = travellers.find((item)=>{
          return item.Id != userInfo.Id;
        })
        if(traveller){
          this.toastMsg('没有为其他员工预订的权限');
          return;
        }
    }

    let sony = false //判断是Sony公司的ID时只能选一人
    SonyList.map((item)=>{
          if (customerInfo?.Customer?.Id === item) {
            const employeesLength = Array.isArray(employees) ? employees.length : 0;
            const travellersLength = Array.isArray(travellers) ? travellers.length : 0;
            if (employeesLength + travellersLength > 1) {
                sony = true;
            }
        }
    })
    if(sony){
          this.toastMsg('该客户只能选一人')
          return
      };

      if (employees.length + travellers.length === 0) {
           this.toastMsg('用户不能为空');
           return;
      }
    if (employees.length + travellers.length > 9) {
          this.toastMsg('最多购买人数为9人,请手动删除多余人员');
          return;
      }
      travellers&&travellers.map((item)=>{
          item.PassengerOrigin={
              Type:2,
              TravellerId: item.Id
          }
      })
      // let travellersArr = employees.concat(travellers)
      // for (let index = 0; index < travellersArr.length; index++) {
      //     const obj = travellersArr[index];
      //     if (!obj.Mobile) {
      //       this.toastMsg(I18nUtil.tranlateInsert('{{noun}}手机号不能为空', obj.Name));
      //       return;
      //     }
      //     if (!obj.Birthday) {
      //       this.toastMsg(I18nUtil.tranlateInsert('{{noun}}出生日期不能为空', obj.Name));
      //       return;
      //     }
      //     // if (!obj.CertificateNumber) {
      //     //     this.toastMsg(I18nUtil.tranlateInsert('{{noun}}证件号码不能为空', obj.Name));
      //     //     return;
      //     // }
      // }
      if(!selectTap){
          this.toastMsg('请选择预订业务');
          return;
      } 
      if(!ReferenceEmployeeId && employees.length>1){
          this.toastMsg('您选择了多位出差人，请选择一位员工作为差旅规则及审批规则的参照人');
          return;
      }

      let customerInfoSet = customerInfo && customerInfo.Setting
       if( !customerInfoSet.IsHiddenProject && customerInfoSet.IsHiddenDepartment ){
            if(!parseInt(ApproveOrigin.ProjectId)){
            this.toastMsg('请选择项目出差');
            return
            }
      }

      let obj={} ;
      if(employees&&employees.length===1 && employees[0].PassengerOrigin&& employees[0].PassengerOrigin.EmployeeId == userInfo.Id ){
        obj = employees[0]
      }
    setReferenceEmployee(JSON.stringify(ReferenceEmployee)==='{}'?obj:ReferenceEmployee);//存入出差人中参考出差人的信息
    this.props.setHotelShareArr(null); //清空酒店合住人
    // this._checkTravellers();//检查出差人 
    this._objectClick()

}

_checkTravellers=()=>{
    const {employees, travellers,ProjectId, userInfo,selectTap,ReferenceEmployeeId} = this.state;
    const {setCheckTravellers,apply} = this.props;
  //    let IsJourneyType = this.customerInfo&&this.customerInfo.Setting.FlightTravelApplyConfig.IsJourneyType
    let referenceId = ReferenceEmployeeId
    if(employees&&employees.length===1 &&employees[0].PassengerOrigin&& employees[0].PassengerOrigin.EmployeeId == userInfo.Id ){
        referenceId = employees[0].PassengerOrigin&& employees[0].PassengerOrigin.EmployeeId
    }
    let model={
      MassOrderId:null,
      Category:selectTap,//业务分类（1:国内机票,4:国内酒店,5:火车票,6:港澳台及国际酒店,7:国际机票），该字段必填
      ReferenceEmployeeId:referenceId,//差旅规则及审批规则的参照员工ID。如果没有综合订单ID，且有多个出差员工时这个字段必填！（出差员工+当前预订人中的任意一人）
      ProjectId:ProjectId,
      Travellers:employees.concat(travellers)
    }
    this.showLoadingView();
    ComprehensiveService.MassOrderCheckTravellers(model).then(response => {
    this.hideLoadingView();
        if (response && response.success&&response.data) {
            setCheckTravellers(response.data);
            if(apply){
                this._checkTravelApply()//检查申请单
            }else{
                this.setState({
                    chooseApply:false
                },()=>{
                    this._createSure()
                })
            }

        }else{
            this.hideLoadingView();
            this.toastMsg(response.message);
        }
    }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message);
    }) 
    this._loadcomprehensiveData()
}

_loadcomprehensiveData=()=>{
  const {onLoadcomprehensiveData} = this.props;
  const {employees, travellers,ProjectId, userInfo,ProjectItem,ReferenceEmployeeId} = this.state;

  let referenceId = ReferenceEmployeeId
  if(employees&&employees.length===1 &&employees[0].PassengerOrigin&& employees[0].PassengerOrigin.EmployeeId == userInfo.Id ){
      referenceId = employees[0].PassengerOrigin&& employees[0].PassengerOrigin.EmployeeId
  }

  let referencPassengerId
  if(employees&&employees.length>0){
          let num = employees.length-1
          referencPassengerId = employees[num]&&employees[num].PassengerOrigin&&employees[num].PassengerOrigin.EmployeeId
  }else{
      referencPassengerId = userInfo&&userInfo.Id
      referenceId = userInfo&&userInfo.Id
  }
  let IdModel = {
      ReferenceEmployeeId:referenceId,
      ReferencePassengerId:referencPassengerId,
  }
  employees&&employees.map((item)=>{
      item.shareRoomSelect = false
  })
  travellers&&travellers.map((item)=>{
      item.shareRoomSelect = false
  })
  onLoadcomprehensiveData(userInfo,employees,travellers,ProjectId,referenceId,IdModel,referencPassengerId,ProjectItem)
}

_createSure=()=>{
  const { selectTap,ReferenceEmployee,chooseApply,customerInfo } = this.state;
  let IsJourneyType =chooseApply? customerInfo&&customerInfo.Setting.FlightTravelApplyConfig.IsJourneyType :false
  Bussiness.map((item)=>{
      if(item.num==selectTap){
         this.push(item.Cheekpage,{
              ReferenceEmployee:ReferenceEmployee,
              selectTap,
              IsJourneyType:IsJourneyType,
              chooseApply,
              isIntl:item.type=='intlHotel'?true:false,
              customerInfo:customerInfo,
          })
      }
   })
}

_checkTravelApply=()=>{
  const {travellers,employees,category,arrivalCityDisplay,goCityDisplay,selectTap,ReferenceEmployee,selectApplyItem,chooseApply,customerInfo} = this.state;
  let IsJourneyType = chooseApply? customerInfo&&customerInfo.Setting.FlightTravelApplyConfig.IsJourneyType : false
  const {apply} = this.props;
  let model ={
      ApplyId:apply&&apply.Id, //申请单对象
      JourneyId:null,//申请单行程Id
      Category: category,//订单类型 1.国内机票，8国际机票，4国内酒店，16国际酒店，2火车票
      // Departure: goCityDisplay&&goCityDisplay.Name,//出发城市（查询出发城市）
      // Destination: arrivalCityDisplay&&arrivalCityDisplay.Name,//到达城市（查询到达城市）
      Departure: null,//出发城市（查询出发城市）
      Destination: null,//到达城市（查询到达城市）
      BeginTime:null, //出发时间(填查询时间)
      JourneyType:null,//行程类型  单程或往返 1.单程，2.往返
      EndTime:null, //到达时间(填查询时间)
      Travellers:employees.concat(travellers), //综合订单自己选的人
  };
  let goCity = null
  let arrivalCity = null
  if(selectTap==1){
      if(goCityDisplay){
          goCity ={
              Code:goCityDisplay.IataCode,  
              Name:goCityDisplay.Name,
              EnName:goCityDisplay.EnName,
              Province:goCityDisplay.ProvinceName,
              Letters:goCityDisplay.Letters,
              Hot:goCityDisplay.Hot
          }
      }
      if(arrivalCityDisplay){
          arrivalCity = {
              Code:arrivalCityDisplay.IataCode,  
              Name:arrivalCityDisplay.Name,
              EnName:arrivalCityDisplay.EnName,
              Province:arrivalCityDisplay.ProvinceName,
              Letters:arrivalCityDisplay.Letters,
              Hot:arrivalCityDisplay.Hot
          }
      }
  }else if(selectTap==7){
      if(goCityDisplay){
          goCity = {
              CityCode:goCityDisplay.IataCode,
              CityEg:goCityDisplay.EnName,
              CityEnName:goCityDisplay.EnName,
              CityName:goCityDisplay.Name,
              Cname:goCityDisplay.Name,
              NationalCode:goCityDisplay.NationalCode,
              NationalEg:goCityDisplay.EnNationalName,
              NationalName:goCityDisplay.NationalName,
          }
      }
      if(arrivalCityDisplay){
          arrivalCity = {
              CityCode:arrivalCityDisplay.IataCode,
              CityEg:arrivalCityDisplay.EnName,
              CityEnName:arrivalCityDisplay.EnName,
              CityName:arrivalCityDisplay.Name,
              Cname:arrivalCityDisplay.Name,
              NationalCode:arrivalCityDisplay.NationalCode,
              NationalEg:arrivalCityDisplay.EnNationalName,
              NationalName:arrivalCityDisplay.NationalName,
          }
      }
  }else if(selectTap==4 ||selectTap==5 || selectTap==6){
      goCity = goCityDisplay
      arrivalCity = arrivalCityDisplay
  }
  let DestinationBeginTime;//当前页面选择申请单 目的地模式情况的 出发时间
  let JourneyBeginTime;// 当前页面选择申请单 行程模式情况的 出发时间
  let DestinationEndTime;//当前页面选择申请单 目的地模式情况的 出发时间
  let JourneyEndTime;// 当前页面选择申请单 行程模式情况的 出发时间
  if(apply.Destination){
      DestinationBeginTime = apply.Destination.BeginTime
      DestinationEndTime = apply.Destination.EndTime
  }
  if(selectApplyItem){
      JourneyBeginTime = selectApplyItem.BeginTime
      JourneyEndTime = selectApplyItem.EndTime
  }
  let begintime = this.params.BeginTime ? this.params.BeginTime : JourneyBeginTime ? JourneyBeginTime : DestinationBeginTime
  let endtime = this.params.EndTime ? this.params.EndTime : JourneyEndTime ? JourneyEndTime : DestinationEndTime
  CommonService.OrderValidateTravelApply(model).then(response => {
      if (response && response.success) {
           //跳转
          Bussiness.map((item)=>{
             if(item.num==selectTap){
                this.push(item.Cheekpage,{
                      ReferenceEmployee:ReferenceEmployee,
                      selectTap,
                      IsJourneyType:IsJourneyType,
                      SerialNumber:apply.SerialNumber,
                      arrivalCityDisplay:arrivalCity,
                      goCityDisplay:goCity,
                      selectApplyItem:selectApplyItem,
                      BeginTime:begintime,
                      EndTime:endtime,
                      chooseApply,
                      customerInfo:customerInfo,
                })
             }
          })
      } else {
          this.toastMsg(response.message || '操作失败');
      }
  }).catch(error => {
      this.toastMsg(error.message || '操作失败');
  })
}


_getCompList=()=>{
  const{ customerInfo,compSwitchOnOff,userInfo }= this.state
  compSwitchOnOff && compSwitchOnOff!=2?
           this.push('ComprehensiveListScreen',{customerInfo,userInfo})
           :
           this.push('Journey')
}
  _testAlert = () => {
    const {noticeAdList} = this.state;
    let w_img = global.screenWidth - 90;//图片宽
    let h_img =w_img/280*250;//图片高 宽高比280:250
    let height = h_img+40;//广告高
    return(
      <View  style={{position:'absolute',top:-94, height:global.screenHeight, width:global.screenWidth}}>
        <View style={styles.container2}>
        {//图片宽280 高250， 底部高40
            <View style={{height:height,marginHorizontal:8,width:w_img,borderRadius:10}}>
              <Swiper
                  autoplay={false}
                  style={{}}
                  paginationStyle = {{bottom:30}}
                  dotStyle={{width:4,height:4}}
                  activeDotStyle={{width:4,height:4,backgroundColor:Theme.theme}}
                  >
                  {noticeAdList.map((item, index) => {
                      let items = '';
                      if (item.AdContentInfo) {
                          items = {
                              content: item.AdContentInfo.Content,
                              title: item.AdContentInfo.Name,
                              LinkUrl: null
                          }
                      }
                      return (
                          <View 
                              key={index}
                              style={{borderRadius:10,backgroundColor:'#fff' }}
                          >
                              <View style={{borderRadius:10}}>
                                 { item.AdContentInfo&&item.AdContentInfo.ImgUrl?
                                      <TouchableOpacity onPress={() => { this._toAdDetail(item) }}>  
                                        <ImageBackground
                                                source={{uri:item.AdContentInfo.ImgUrl}}
                                                resizeMode={'contain'}
                                                style={{height:h_img,width:w_img,borderTopLeftRadius:10,borderTopRightRadius:10 }}
                                                imageStyle={{ borderTopLeftRadius:6,borderTopRightRadius:6 }}
                                                key={index}
                                            >
                                              {this._adtitle()}
                                        </ImageBackground>
                                      </TouchableOpacity>
                                      :
                                      <View style={{height:h_img,width:w_img,borderTopLeftRadius:10,borderTopRightRadius:10 }}>
                                        {this._adtitle()}
                                        <ScrollView style={{paddingHorizontal:10}}>
                                          <HTMLView value={items.content} />
                                        </ScrollView>
                                      </View>
                                  }
                                  <TouchableOpacity onPress={() => { this._toAdDetail(item) }} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',height:40,paddingHorizontal:10,borderRadius:10}}>
                                        <CustomText text={item.ContentName} style={{  fontSize: 12,marginBottom:5,color:Theme.fontColor}} />
                                        <CustomText text={'详情 >'} style={{ marginLeft: 5, fontSize: 12,marginBottom:5,color:Theme.commonFontColor}} />
                                  </TouchableOpacity> 
                              </View>
                        </View>
                      );
                      })}
              </Swiper>
            </View>
          }
          </View>
      </View>
    )
  }

  _adtitle = () => {
    return(
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <CustomText text={'为您推荐'} style={{color:'#fff',backgroundColor:'rgba(0, 0, 0, 0.3)',fontSize:12,padding:4,borderRadius:5,marginLeft:15}}/>
            <TouchableOpacity style={{height:50,width:50,alignItems:'center'}} 
                              onPress={() => {
                                  this.setState({
                                      IsAddShow:false
                                  },()=>{
                                    StorageUtil.saveKey(Key.HomeAdd,true);
                                  })
                              }}>
                <AntDesign name={'closecircle'} size={20} color={'rgba(0, 0, 0, 0.3)'} style={{marginTop:12}}/>
            </TouchableOpacity>
        </View>
    )
  }

   /**
      *  广告详情页面
      */
   _toAdDetail = (item) => {
    this.setState({
      IsAddShow:false,
    })
    if (item.AdContentInfo) {
        if (item.AdContentInfo.AdLink) {
            this.push( "Web", {
                title: item.ContentName,
                url: item.AdContentInfo && item.AdContentInfo.AdLink
            })
        } else {
            let items = {
                content: item.AdContentInfo.Content,
                title: item.AdContentInfo.Name,
                LinkUrl: null
            }
            this.push('NoticeDetail',
                { item: items }
            )
        }
    }
}

  //退出登录
  _btnLogOut = () => {
    this.showAlertView('确定要退出登录吗?', () => {
        return ViewUtil.getAlertButton('取消', () => {
            this.dismissAlertView();
        }, '确定', () => {
            this.dismissAlertView();
            this.showLoadingView();
            CommonService.logout().then(response => {
                if (response && response.success) {
                    this.props.setApply(null)//清空申请单数据
                    UserInfoDao.removeAllInfo().then(() => {
                        this.hideLoadingView();
                        // UMNative.profileSignOff();
                        StorageUtil.saveKey(Key.HomeAdd,null);
                        StorageUtil.saveKey(Key.ShowTipAlert,0);
                        // AliyunPush.setApplicationIconBadgeNumber(0);
                        this.push('Init');
                    }).catch(error => {
                        this.hideLoadingView();
                        this.toastMsg(error.message || '退出登录失败');
                    })
                    // 注销推送标签
                    // AliyunPush.listTags(1).then((result)=>{
                    //       // console.log("listTags1 success");
                    //       // console.log(JSON.stringify(result));
                    //       let arr = result.split(",")
                    //       AliyunPush.unbindTag(1,arr,"")
                    //       .then((result)=>{
                    //           // console.log("unbindTag succcess");
                    //           // console.log(JSON.stringify(result));
                    //       })
                    //       .catch((error)=>{
                    //           console.log("unbindTag error");
                    //           console.log(JSON.stringify(error));
                    //       });
                    // }).catch((error)=>{
                    //     console.log("listTags error");
                    //     console.log(JSON.stringify(error));
                    // });
                } else {
                    this.hideLoadingView();
                    this.toastMsg(response.message || '退出登录失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '退出登录失败');
            });
        })
    })
}

  _changeLanguage = () => {  
    this.LeftClicked(false);
    this.setState({
        select: this.state.select.value === 'zh' ? {
          name: 'English',
          value: 'en'
        } : {
          name: '简体中文',
          value: 'zh'
        }
    }, () => {
        const { languageChange } = this.props;
        const { select,compSwitchOnOff,notifySelect } = this.state;
        languageChange(select, () => {
            let model = {
                UiLanguage:select.value==='zh'?'zh-cn':'en-us',
                NotifyLanguage:notifySelect.value === 'zh'?'zh-cn':'en-us',
              }
            CommonService.CurrentUserChangeLanguage(model).then(response => {
                if (response && response.success) {
                    this.showAlertView('切换语言成功', () => {
                      return ViewUtil.getAlertButton('确定', () => {
                      this.dismissAlertView();
                          if(compSwitchOnOff==1){
                            this._getCompOrderData();
                          }
                          this.fetchBookingConfig();
                      })
                    })
                } 
            })
        });
    })
}
_changeLanguageNotif = () => {
  this.LeftClicked(false)
   this.setState({
    notifySelect: this.state.notifySelect.value === 'zh' ? {
        name: 'English',
        value: 'en',
        Notify_language:'en-us'
      }:{
        name: '简体中文',
        value: 'zh',
        Notify_language:'zh-cn'    
      }
    },()=>{
         let model = {
            UiLanguage:this.state.select.value === 'zh'?'zh-cn':'en-us',
            NotifyLanguage:this.state.notifySelect.Notify_language,
          }
          CommonService.CurrentUserChangeLanguage(model).then(response => {
              if(response && response.success) {
                  this.showAlertView('通知语言切换成功', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                    this.dismissAlertView();
                    })
                  })           
              }
          })  
   })
}

  /**
  * 行程管理
  */
  _renderTravelOrder = () => {
  const { isTravelOrder, userInfo, customerInfo,unUsedOrder, unUsedTrainOrder, unUsedIntlFlightOrder, unUsedHotelOrder, unUserIntlHotelOrder } = this.state;
  if (!isTravelOrder || !userInfo) return null;
  return (
    <ScrollView >
      <HomeUnTravelView
            userInfo={userInfo || {}}
            unUsedOrder={unUsedOrder} 
            unUsedTrainOrder={unUsedTrainOrder}
            unUsedIntlFlightOrder={unUsedIntlFlightOrder}
            unUsedHotelOrder={unUsedHotelOrder}
            unUserIntlHotelOrder={unUserIntlHotelOrder}
      />       
    </ScrollView>
  )
}

  // 导航栏右侧按钮
  _renderHomeHeaderRightButton = () => {
    return (
      <View>
        <TouchableOpacity onPress={this._toNoticeCenter} style={{ padding: 8, paddingLeft: 12 }}>
          <Ionicons name={'ios-arrow-back'}
            size={26}
            style={{ color: Theme.fontColor }}
          />
        </TouchableOpacity>
      </View>
    )
  }

  //呼叫客服
  _call =()=>{
    var url = 'tel:';
    const{ customerInfo } = this.state;
    this.LeftClicked(false)
    if(customerInfo&& customerInfo.Setting && customerInfo.Setting.ServiceTelExtras && customerInfo.Setting.ServiceTelExtras.Tel){
      url = `tel:${customerInfo.Setting.ServiceTelExtras.Tel}`
    }
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
}

const barArr1 = [
  {
      name: '呼叫客服',
      require: require('../../res/Uimage/myself/callapp.png'), 
  },
  {
      name: '关于我们',
      require: require('../../res/Uimage/myself/infocircle.png'), 
  }
]

/**
 * 订单模式显示
 */
const barArr2 = [
  {
      name: '综合订单列表',
      require: require('../../res/Uimage/myself/complist.jpg'), 
  },
  {
      name: '审批',
      require: require('../../res/Uimage/myself/approve.png'),
  },
  {
    name: '出差单',
    require: require('../../res/Uimage/myself/my_bag.png'),
  },
  {
      name: '我的',
      require: require('../../res/Uimage/myself/user_self.png'),
  }, 
  {
    name: '支付列表',
    require: require('../../res/Uimage/flightFloder/_yuan.png'),
  },
]
const barArrLast = [
  {
      name: '退出登录',
      require: require('../../res/Uimage/myself/poweroff.png'), 
  },
  {
      name: '注销账户',
      require: require('../../res/Uimage/myself/stop.png'), 
  }
]

const getProps = state => ({
  apply: state.apply.apply,
  language: state.language.language,
  customerInfo_userInfo: state.customerInfo_userInfo,
  profileCommonEnum: state.profileCommonEnum,
})
const getAction = dispatch => ({
  onLoadcomprehensiveData:(userInfo,employees,travellers,ProjectId,ReferenceEmployeeId,IdModel,referencPassengerId,ProjectItem)=>dispatch(action.onLoadcomprehensiveData(userInfo,employees,travellers,ProjectId,ReferenceEmployeeId,IdModel,referencPassengerId,ProjectItem)),
  setApply: (value) => dispatch(action.applySet(value)),
  loadComprehensiveSwitch:(bool)=>dispatch(action.loadComprehensiveSwitch(bool)),
  setCustomer_userInfo:(customerInfo,userInfo)=>dispatch(action.setCustomer_userInfo(customerInfo,userInfo)),
  setComp_Id: (value) => dispatch(action.setComp_Id(value)),
  languageChange: (language, callBack) => dispatch(action.languageChange(language, callBack)),
  setHotelShareArr:(shareAllArr)=>dispatch(action.setHotelShareArr(shareAllArr)),
  setReferenceEmployee: (value) => dispatch(action.setReferenceEmployee(value)),
  onClickSure:(compCreateBool)=>dispatch(action.onClickSure(compCreateBool)),
  setCheckTravellers:(travellers)=>dispatch(action.setCheckTravellers(travellers)),
  getProfileCommonEnum:(value)=>dispatch(action.getProfileCommonEnum(value)),
})

export default connect(getProps, getAction)(HomeScreen);
const drawerStyles = {
  drawer:{ 
     shadowColor:'#FFF', 
     shadowOpacity:0.8, 
     shadowRadius:6},
     main:{
        paddingLeft:3
     },
     flex:1     
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  container2:{
    flex:1,
    backgroundColor:'rgba(0, 0, 0, 0.3)',
    justifyContent:'center',
    alignItems:'center',
  },
  header_view: {
    backgroundColor: Theme.TopColor,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header_line: {
    height: 2,
    width: 30,
    marginTop: 5
  },
  header_text: {
    color: Theme.fontColor,
    // fontSize: 16,
  },
  noneBtnView:{
    width:80,
    height:30,
    marginTop:15,
    alignItems:'center',
    justifyContent:'center',
    borderWidth:0.5,
    borderColor:Theme.theme,
    borderRadius:15
  },
  btnStyle:{
    flexDirection:'row',
    marginHorizontal:10,
    alignItems:'center',
    justifyContent:'space-between',
    backgroundColor:'#fff',
    height:46
  },
  alertStyle:{
    width: '80%', 
    backgroundColor:'#fff',
    borderRadius:8,
    padding:10,
  },
  addStyle:{
    width: '90%', 
    backgroundColor:'#fff',
    borderRadius:8,
    padding:10,
    height:220,
  },
  viewStyle:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#fff',
    height:40,
    borderBottomLeftRadius:6,
    borderBottomRightRadius:6,
  },

  header_text: {
    color: Theme.fontColor,
  },
  header_view1: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  section: {
    // height: 44,
    paddingHorizontal: 10,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: "center",
    borderColor:Theme.themeLine,
    borderBottomWidth:1,
    marginHorizontal:5,
    flex:1
  },
  tapStyle:{
      height:34,
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'center',
      borderRadius:6,
      borderWidth:1,
      marginRight:10,
      marginVertical:5
  },

})


const Bussiness = [
  {
      type: 'flight',
      name: '国内机票',
      Cheekpage: 'FlightSearchIndex',
      num:1,
  },
  {
      type: 'intlFlight',
      name: '港澳台及国际机票',
      Cheekpage: 'IntlFlightIndex',
      num:7,
  }, {
      type: 'train',
      name: '火车票',
      Cheekpage: 'TrainIndexScreen',
      num:5,
  }, {
      type: 'hotel',
      name: '国内酒店',
      Cheekpage: 'HotelSearchIndex',
      num:4,
  }, {
      type: 'intlHotel',
      name: '港澳台及国际酒店',
      Cheekpage: 'HotelSearchIndex',
      num:6,
  }   
  
]
