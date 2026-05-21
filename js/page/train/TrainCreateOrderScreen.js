import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    Platform,
    ImageBackground,
    StyleSheet,
    Dimensions,
    Alert,
} from 'react-native';
import StorageUtil from '../../util/StorageUtil';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import CommonService from '../../service/CommonService';
import CommonEnum from '../../enum/CommonEnum';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import CustomText from '../../custom/CustomText';
import HeaderView from './HeaderView';
import PassnegerView from '../common/PassnegerView';
import RelateTrainView from '../common/RelateTrainView';
import UserInfoUtil from '../../util/UserInfoUtil';
import BackPress from '../../common/BackPress';
import ContactView from '../common/ContactView';
import AdditionInfoView from '../common/AdditionInfoView';
import { connect } from 'react-redux';
import Theme from '../../res/styles/Theme';
import SeatView from './SeatView';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import I18nUtil from '../../util/I18nUtil';
import Util from '../../util/Util';
import PriceDetailView from './PriceDetailView';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AdCodeEnum from '../../enum/AdCodeEnum';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AdContentInfoView from '../common/AdContentInfoView';
import TrainRadioView from './TrainRadioView';
import CustomActionMulChoiceSheet from '../../custom/CustomActionMulChoiceSheet';
import Pop from 'rn-global-modal';
import TrainService from '../../service/TrainService';
import HighLight from '../../custom/HighLight';
import OpenGetFile from '../../service/OpenGetFile';
import OpenGetPic from '../../service/OpenGetPic';
import MerchantPriceUtil from '../../util/MerchantPriceUtil';
import Utils from '../../util/Util';
import  LinearGradient from 'react-native-linear-gradient';
import {HighLight2,TitleView2} from '../../custom/HighLight';
import CustomeTextInput from '../../custom/CustomTextInput';


const screenWidth = Dimensions.get('screen').width;
var diedlineTime;
class TrainCreateOrderScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '订单填写',
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
            leftButton2:true,
            // rightButton: props.feeType === 1 ? ViewUtil.getRightButton('差旅标准', this._getTravelRule) : null
        }
        let options = ['身份证', '护照', '港澳台居民居住证', '外国人永久居留身份证', '台湾居民来往大陆通行证', '港澳居民来往内地通行证'];
        let optionNum = [];
        options.forEach((item,index)=>{
            if(Util.Read.certificateType2(item)){
                optionNum.push(Util.Read.certificateType2(item))
            }
        })
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: 'white'
        }
        let isWoPu = false;
        let ticket = this.params.ticket;
        if (ticket && ticket.selectedSeat && ticket.selectedSeat.seat && ticket.selectedSeat.seat.includes('卧')) {
            isWoPu = true;
        }
        let ticketArr = []
        ticket&&ticket.ticketTypes.map((item)=>{
            ticketArr.push([item.seat,item.checkSeat]);
        })
        function isMinNum(data_item) {
            return (data_item[0] != ticket.selectedSeat.seat);
          }
        let returnTicketArr = ticketArr.filter(isMinNum);
        const { apply, comp_userInfo } = this.props;
        if(comp_userInfo&&comp_userInfo.ProjectItem && apply&&apply.ApproveOrigin){//如果订单和出差单都选择项目审批 使用出差单的项目审批规则
            if(comp_userInfo.ProjectItem.OriginType==apply.ApproveOrigin.OriginType==1){
                comp_userInfo.ProjectItem = apply.ApproveOrigin
            }
        }
        this.state = {
            showTip: isWoPu,
            // 用户信息
            userInfo: {},
            //客户信息
            customerInfo: {},
            //员工
            employees: [],
            //常旅客
            travellers: [],
            // 联系人
            Contact: {
                Name: '',
                Mobile: '',
                Email: ''
            },
            // 费用归属
            ApproveOrigin:comp_userInfo.ProjectItem?comp_userInfo.ProjectItem:
                // apply && apply.ApproveOrigin ? apply.ApproveOrigin :   
                {},
            // 数据字典
            AdditionInfo: apply && apply.Addition ? {
                ...apply.Addition,
                DictItemList: apply.Addition.DictItemList ? apply.Addition.DictItemList : []
            } : {
                    DictItemList: []
                },
            // 选择的座席
            selectSeat: [],
            //是否接受无座
            isReceiveNoSeat: false,
            //广告
            adList: [],
            flag:1,//选择开车前几小时
            options: [],//抢票推荐备选日期
            selectOption: null,//抢票选择后的备选日期 
            trainCodeList:[],//抢票选择后的备选车次
            setOptions:[],//抢票选择后推荐备选坐席
            setType:returnTicketArr,//抢票推荐备选坐席
            TrainDiedline:[],//选择的备选车次的开车时间
            TrainPrice:'',//所选车次的票价
            diedlineTime:'',//最后抢票时间
            setSelects:[ticket&&ticket],//选中的备选车次集合
            feeType:this.props.FeeType,
            login12306Name:null,//12306账号
            login12306Data:0,//关联12306后俩接口返回的data
            passWord:null,//12306密码
            multSelectItems:null,
            re_setTyp:null,
            re_TrainDiedline:null,
            re_setSelects:[],
            relateYn:null,//0关联中，1关联成功，2.关联失败
            loginSuccess:false,
            ServiceFeesData:[],
            fileList:[],
            nullDictList:[],
            PdfDictList:[],
            InvoiceInfo:null,
            ReceiveEmail:'',
            optionNum:optionNum
        }
        this.backPress = new BackPress({ backPress: () => this._backBtnClick() })
    }
    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: false
        }
    }
    /**
    *  返回的操作
    */
    _backBtnClick = () => {
        this.showAlertView('您的订单尚未填写完成,是否确定要离开当前页面?', () => {
            return ViewUtil.getAlertButton('取消', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                this.pop();
            })
        });
        return true;
    }
    /**
       *  获取差旅标准
       */
    _getTravelRule = () => {
        this.showLoadingView();
        let modelStandar={
            OrderCategory:CommonEnum.orderIdentification.train,
        }
        CommonService.GetTravelStandards(modelStandar).then(response => {
            this.hideLoadingView();
            if (response?.data?.RuleDesc?.length > 0) {
                Pop.show(
                    <View style={styles.alertStyle}>
                       <View style={{alignItems:'center',justifyContent:'center'}}>
                           <CustomText text={'温馨提示'} style={{margin:6,fontSize:18, fontWeight:'bold'}} />
                       </View>
                       <View style={{width:'80%'}}>
                           <CustomText text={response.data.OrderCategoryDesc} style={{padding:2,fontSize:14,fontWeight:'bold'}}/>
                           {
                               response.data.RuleDesc.map((item)=>{
                                   return(
                                     <View style={{flexDirection:'row',padding:2}}>
                                        <CustomText text={item.Name}/>
                                        <CustomText text={': '}/>
                                        <CustomText text={item.Desc} style={{marginRight:25}}/>
                                     </View>
                                   )
                               })
                           }
                       </View>
                       <TouchableHighlight underlayColor='transparent' 
                                 style={{height:40,alignItems:'center',justifyContent:'center',marginTop:10,borderTopWidth:1,borderColor:Theme.lineColor}}
                                 onPress={()=>{Pop.hide()}}>
                                 <CustomText  text='确定' style={{fontSize:19,color:Theme.theme}}/>
                        </TouchableHighlight>
                    </View>
                    ,{animationType: 'fade', maskClosable: false, onMaskClose: ()=>{}})
             
            } else {
                this.showAlertView('国内火车票:不限');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
  
    componentDidMount() {
        const { employees, travellers,Contact, ApproveOrigin,AdditionInfo } = this.state;
        const { ticket,seat } = this.params;
        const { comp_userInfo,profileCommonEnum } = this.props;
        let trainBookingConfig = profileCommonEnum?.data?.bookingConfig?.trainBookingConfig;
        comp_userInfo.employees&&comp_userInfo.employees.map((data)=>{
            const {optionNum} = this.state
            const config = trainBookingConfig.find(c => {
                const currentNation = c.nation;
                const passengerNation = data.NationalCode;
                return (
                  currentNation === passengerNation || (!passengerNation && currentNation === '') ||
                  (!['CN','HK','MO','TW'].includes(passengerNation) && currentNation === '_')
                );
              
              });
            let certTypes = config?.certTypes
            if(!(data.Certificates&&data.Certificates.length>0)){
                if(!optionNum.includes(Utils.Read.certificateType2(data?.CertificateType))){
                    data = this._handleLevel(data)
                }
                return
            }
            data.Certificates.map((itemIdCar)=>{//levelNum火车票证件展示优先级数值
                //如果itemIdCar.Type包含于certTypes中，说明是符合优先级的证件
                if(certTypes.includes(itemIdCar.Type)){
                    itemIdCar.levelNum = Utils.Read.TrainTypeCertifLevel(itemIdCar.Type)
                }else{
                    itemIdCar.levelNum = 100
                }
            })
            
            let min = data.Certificates.reduce((prev, current) => (prev.levelNum < current.levelNum ? prev : current));//优先级数值越小，优先级越高，找到优先级最高的
            if(min.levelNum&&min.levelNum!=100){//如果优先证件等于100，说明没有符合优先级的证件，按原有展示
                data = this._handleLevel(data,min);
            }else{
                data = this._handleLevel(data,null);
            }
        })
        comp_userInfo.travellers&&comp_userInfo.travellers.map((data)=>{
            const {optionNum} = this.state
            if(!(data.Certificates&&data.Certificates.length>0)){
                if(!optionNum.includes(Utils.Read.certificateType2(data?.CertificateType))){
                    data = this._handleLevel(data)
                }
                return
            }
            data.Certificates.map((itemIdCar)=>{//levelNum火车票证件展示优先级数值
                itemIdCar.levelNum = Utils.Read.TrainTypeCertifLevel(itemIdCar.Type)
            })
            let min = data.Certificates.reduce((prev, current) => (prev.levelNum < current.levelNum ? prev : current));//优先级数值越小，优先级越高，找到优先级最高的
            if(min.levelNum&&min.levelNum!=100){//如果优先证件等于100，说明没有符合优先级的证件，按原有展示
                data = this._handleLevel(data,min);
            }else{
                data = this._handleLevel(data,null);
            }
        })

        let arr = []
        comp_userInfo.employees&&comp_userInfo.employees.map((item)=>{
            if(item.ElectronicItineraryInfo&&item.ElectronicItineraryInfo.Id){
                arr.push(item.ElectronicItineraryInfo.Id) 
             }else{
                arr.push(-1) 
             }
        })
        if(new Set(arr).size === 1){
            this.setState({
                InvoiceInfo:comp_userInfo.employees[0].ElectronicItineraryInfo,
            })
        }

        this.setState({
            employees:comp_userInfo.employees,
            travellers:comp_userInfo.travellers
        }) 
        this.backPress.componentDidMount();

        this._loadMassegeAgain();
        CommonService.GetAdStrategyContent(AdCodeEnum.trainOrder).then(response => {
            if (response && response.success) {
                this.setState({
                    adList: response.data
                })
            }
        }).catch(error => {

        })

         //服务费
        let model={
            OrderCategory:5,
            MatchModel:{
                IsGrabTicket:seat==0?true:false
            },
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        }
        CommonService.CurrentCustomerServiceFees(model).then(response => {
            if (response && response.success) {
                this.setState({
                    ServiceFeesData:response.data
                    // IsGrabTicket
                })
            }
        }).catch(error => {
            
        })
    }

    _loadMassegeAgain = () => {
        const { Contact } = this.state;
        this.showLoadingView();
        CommonService.getUserInfo().then(userInfoRes => {
            if (userInfoRes && userInfoRes.success && userInfoRes.data) {
                let userInfo = userInfoRes.data;
                Object.assign(Contact, userInfo.OrderContact ? userInfo.OrderContact : {});
                let model={
                    ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                    ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
                }
                CommonService.customerInfo(model).then(response => {
                    if (response && response.success) {
                        let customerInfo = response.data;
                        this.state.actionSheetOptions = UserInfoUtil.DeliveryItems(customerInfo);
                        if(customerInfo&&customerInfo.TrainAccount){
                            this.setState({
                                relateYn:0
                            })
                            //获取完信息先免密登录12306-----------------------------
                            this.hideLoadingView();
                                let model = {
                                    TrainAccount:customerInfo.TrainAccount
                                }  
                                TrainService.Train12306AutoLogin(model).then(response =>{
                                    if(response.success){
                                        // this.toastMsg(response.message);
                                        this.setState({
                                            relateYn:1
                                        })
                                    }else{
                                        // this.toastMsg(response.message || '操作失败');
                                        this.setState({
                                            relateYn:2
                                        }) 
                                    }
                                }).catch(error=>{
                                    this.hideLoadingView();
                                    this.setState({
                                        relateYn:2
                                    })
                                    this.toastMsg(response.message || '操作失败');
                                })
                            //-----------------------------
                            this.setState({
                                login12306Name:customerInfo.TrainAccount,
                                login12306Data:customerInfo.TrainAccountId,
                            },()=>{
                                StorageUtil.saveKey('login12306Data',customerInfo.TrainAccountId);
                            }) 
                        }
                        CommonService.CurrentDictList({
                            OrderCategory: 5,
                            ShowInApply: false,
                            ShowInDemand: false,
                            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
                        }).then(currentDictList => {
                            this.hideLoadingView();
                            if (currentDictList && currentDictList.success) {
                                customerInfo.DictList = currentDictList.data;
                                this.setState({
                                    userInfo,
                                    customerInfo,
                                    // DicList: arr,
                                },()=>{
                                    this._loadCurrentDicList();
                                })
                            }
                        }).catch(error => {
                            this.hideLoadingView();
                            this.toastMsg(error.message);
                        })
                    } else {
                        this.hideLoadingView();
                        this.toastMsg(response.message || '获取数据失败');
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message);
                })
            } else {
                this.hideLoadingView();
                this.toastMsg(userInfoRes.message || '获取数据失败');
            }
        }).catch(error => {
            this.toastMsg(error.message);
        })
    }

    _loadCurrentDicList = () => {
        const {AdditionInfo,customerInfo} = this.state;
        let arr = customerInfo && customerInfo.DictList ? customerInfo.DictList : []
        let nullDictList = arr&&arr.map((item)=>({
            DictCode:item.Code,
            DictEnName:item.EnName,
            DictId:item.Id,
            DictName:item.Name,
            FormatRegexp:item.FormatRegexp,
            Id:item.Id,
            ItemEnName:null,
            ItemId:"",
            ItemInput:"",
            ItemName:"",
            NeedInput:item.NeedInput,
            Remark:item.Remark,
            RemarkNo:item.RemarkNo,
            NextId:item.NextId,
            ShowInOrder:item.ShowInOrder,
            BusinessCategory:item.BusinessCategory,
        }))
        this.setState({
            nullDictList: nullDictList,
        })
        // this.showLoadingView();
        // CommonService.CurrentDictList({
        //     OrderCategory: 0,
        //     ShowInApply: true,
        //     ShowInDemand: false,
        //     ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
        //     ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        // }).then(response => {
        //     this.hideLoadingView();
        //     if (response && response.success) {
        //         if (response.data) {
        //             let arr = response.data.filter(obj => {
        //                 return obj.ShowInOrder
        //             })
        //             AdditionInfo.DictItemList = arr.map((item)=>({
        //                 DictCode:item.Code,
        //                 DictEnName:item.EnName,
        //                 DictId:item.Id,
        //                 DictName:item.Name,
        //                 FormatRegexp:item.FormatRegexp,
        //                 Id:item.Id,
        //                 ItemEnName:null,
        //                 ItemId:"",
        //                 ItemInput:"",
        //                 ItemName:"",
        //                 NeedInput:item.NeedInput,
        //                 Remark:item.Remark,
        //                 RemarkNo:item.RemarkNo,
        //                 NextId:item.NextId
        //             }))
        //             this.setState({
        //                 DicList: arr,
        //             })
        //         }
        //     } else {
        //         this.toastMsg(response.message || '获取数据失败');
        //     }
        // }).catch(error => {
        //     this.hideLoadingView();
        //     this.toastMsg(error.message || '获取数据异常');
        // })
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
    }


    /**
     * 
     *  创建订单
     */
    _createOrder = () => {
        const { customerInfo} = this.state;
        if(customerInfo&&customerInfo.Setting&&customerInfo.Setting.IsNeedBind12306){
            StorageUtil.loadKey('login12306Data').then(response => {
                if (response>0) {
                    this.setState({
                        login12306Data:response
                    })
                    this._createOrder1();
                }else{
                    this.toastMsg('请关联12306账号');
                    return;
                }
            }).catch(error => {
                console.log(error)
                this.toastMsg('请关联12306账号');
                return;
            })
        }else{
            this._createOrder1();
        }
    }
    _createOrder1 = () => {
        const { employees,travellers, customerInfo, 
                Contact, ApproveOrigin, userInfo, AdditionInfo, 
                selectSeat, isReceiveNoSeat, flag, selectOption,
                TrainPrice,setOptions,setSelects,login12306Data,ServiceFeesData,fileList,nullDictList,InvoiceInfo,ReceiveEmail} = this.state;
        const { ticket,seat } = this.params;
        let DicListArr=[];
        let EmployeeDictListArr=[]
        let diffDicList =[]
        let customerDicList = customerInfo.DictList;
        customerDicList&&customerDicList.map((item)=>{
            DicListArr.push(item.Id);
        })
        customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.map((item)=>{
            EmployeeDictListArr.push(item.Id);
        })
        let diffArr = DicListArr.filter(function (val) { //算出公司字典和用户字典的差集：公司字典含有的、用户字典没有含有的 展示在公司字典处
           return EmployeeDictListArr&&EmployeeDictListArr.indexOf(val)===-1
        })
        customerDicList&&customerDicList.map((item)=>{
            diffArr.map((diffitem)=>{
                if(item.Id == diffitem){
                    diffDicList.push(item)
                }
            })
        })
       
        var subSet = function (arr1, arr2) {//标准项和相同项的差集  3
            var subset = [];
            var IdArr = []
            arr2&&arr2.map((_item)=>{
                IdArr.push(_item.DictId&&_item.DictId)
            })
            var set2 = new Set(IdArr);
            arr1&&arr1.forEach(function(val, index) {
                if (!set2.has(val.Id)) {
                    subset.push(val);
                }
            });
            return subset;
        };

        var getVisibleEmployeeDictIdSet = function (dictConfigList, dictMapList, dictItemList) {
            var configs = dictConfigList || [];
            var mapList = dictMapList || [];
            var configById = {};
            var childIdSet = new Set();
            configs.forEach(function (cfg) {
                if (cfg && cfg.Id !== undefined) {
                    configById[cfg.Id] = cfg;
                }
                if (cfg && cfg.NextId) {
                    childIdSet.add(cfg.NextId);
                }
            });
            var rootIds = [];
            configs.forEach(function (cfg) {
                const isCascadeChild = cfg && cfg.BeforeParentNameList && cfg.BeforeParentNameList.length > 0;
                if (cfg && cfg.Id !== undefined && !childIdSet.has(cfg.Id) && (cfg.ShowInOrder || isCascadeChild)) {
                    rootIds.push(cfg.Id);
                }
            });
            var visibleIdSet = new Set();
            var visiting = new Set();
            var visit = function (id) {
                if (!id || visibleIdSet.has(id) || visiting.has(id)) return;
                visiting.add(id);
                visibleIdSet.add(id);
                var cfg = configById[id];
                var nextId = cfg && cfg.NextId;
                if (nextId) {
                    var parentItem = dictItemList && dictItemList.find(function (it) {
                        if (!it) return false;
                        if (cfg && cfg.Code !== undefined && it.DictCode == cfg.Code) return true;
                        return it.DictId == id;
                    });
                    var parentName = parentItem && parentItem.ItemName;
                    var rules = mapList.filter(function (m) { return m && m.DictId == nextId; });
                    if (rules.length === 0) {
                        visit(nextId);
                    } else if (parentName && rules.some(function (m) { return m && m.ParentName == parentName; })) {
                        visit(nextId);
                    }
                }
                visiting.delete(id);
            };
            rootIds.forEach(function (id) { visit(id); });
            return visibleIdSet;
        };

        for (let index = 0; index < employees.length; index++) {
            const obj = employees[index];
            if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                const visibleIdSet = getVisibleEmployeeDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, obj.Addition && obj.Addition.DictItemList);
                for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                   if (!visibleIdSet.has(customerInfo.EmployeeDictList[i].Id)) {
                       continue;
                   }
                   let itemIndex =  obj.Addition.DictItemList&&obj.Addition.DictItemList.find(
                       item => item.DictId === customerInfo.EmployeeDictList[i].Id
                   );
                   if(!itemIndex){
                       itemIndex = customerInfo.EmployeeDictList[i]
                       itemIndex.DictName =Util.Parse.isChinese() ? customerInfo.EmployeeDictList[i].Name : customerInfo.EmployeeDictList[i].EnName
                   }
                   const isCascadeChild = customerInfo.EmployeeDictList[i].BeforeParentNameList && customerInfo.EmployeeDictList[i].BeforeParentNameList.length > 0;
                   if(customerInfo.EmployeeDictList[i].IsRequire && (customerInfo.EmployeeDictList[i].ShowInOrder || isCascadeChild)){
                       if (customerInfo.EmployeeDictList[i].NeedInput && !itemIndex.ItemName) {
                           this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                           return;
                       } else if (!customerInfo.EmployeeDictList[i].NeedInput && !itemIndex.ItemId) {
                           this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                           return;
                       }
                   }
               }
           }
        }

        for (let index = 0; index < travellers.length; index++) {
            const obj = travellers[index];
            if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                const visibleIdSet = getVisibleEmployeeDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, obj.Addition && obj.Addition.DictItemList);
                for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                   if (!visibleIdSet.has(customerInfo.EmployeeDictList[i].Id)) {
                       continue;
                   }
                   let itemIndex =  obj.Addition.DictItemList&&obj.Addition.DictItemList.find(
                       item => item.DictId === customerInfo.EmployeeDictList[i].Id
                   );
                   if(!itemIndex){
                       itemIndex = customerInfo.EmployeeDictList[i]
                       itemIndex.DictName =Util.Parse.isChinese() ? customerInfo.EmployeeDictList[i].Name : customerInfo.EmployeeDictList[i].EnName
                   }
                   const isCascadeChild = customerInfo.EmployeeDictList[i].BeforeParentNameList && customerInfo.EmployeeDictList[i].BeforeParentNameList.length > 0;
                   if(customerInfo.EmployeeDictList[i].IsRequire && (customerInfo.EmployeeDictList[i].ShowInOrder || isCascadeChild)){
                       if (customerInfo.EmployeeDictList[i].NeedInput && !itemIndex.ItemName) {
                           this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                           return;
                       } else if (!customerInfo.EmployeeDictList[i].NeedInput && !itemIndex.ItemId) {
                           this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                           return;
                       }
                   }
               }
           }
        }
       
        let errTxt = this._orderValidation();
        if (errTxt) {
            this.toastMsg(errTxt);
            return;
        }
        const isBuyerNameEmpty = InvoiceInfo?.BuyerName === '' || !InvoiceInfo?.BuyerName;//抬头名称是否 为空
        if(this.props.feeType==1 && isBuyerNameEmpty && customerInfo?.Setting?.ElectronicItineraryConfig?.TrainIsElectronicItineraryRequired ){
            this.toastMsg('请选择发票抬头');
            return;
        }
        function validateSingleEmail(input) {
            const emailPattern = /^\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}$/g;
            const matches = input.match(emailPattern);
            return matches && matches.length === 1;
        }
        if(customerInfo?.Setting?.ElectronicItineraryConfig?.TrainReceiveEmailRequired){
            if(!ReceiveEmail){
                this.toastMsg('请填写电子行程单的邮箱');
                return;
            }
        }
        if(ReceiveEmail&&!validateSingleEmail(ReceiveEmail)){
            this.toastMsg('填写正确邮箱，且只能填写一个邮箱');
            return;
        }
        if (selectSeat.length > 0 && selectSeat.length !== (employees.length + travellers.length)) {
            this.toastMsg('还有员工未进行选座');
            return;
        }
        if (this.props.feeType === 1) {
            let addition = UserInfoUtil.Addition(customerInfo);
            for (let index = 0; index < addition.length; index++) {
                const obj = addition[index];
                if (obj.state && !AdditionInfo[obj.en]) {
                    this.toastMsg(obj.name + '不能为空');
                    return;
                }
            }
            // if (customerInfo.DictList) {
            //     for (let i = 0; i < customerInfo.DictList.length; i++) {
            //         const obj = customerInfo.DictList[i];
            //         if (obj.IsRequire) {
            //             if (userInfo && userInfo.Customer.Id === Customer.DRHJ && obj.Name === '实施阶段') {
            //                 continue;
            //             }
            //             let dicItem = AdditionInfo.DictItemList.find(dic => dic.DictId === obj.Id);
            //             if (!dicItem) {
            //                 this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
            //                 return;
            //             } else {
            //                 if (obj.NeedInput && !dicItem.ItemName) {
            //                     this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
            //                     return;
            //                 } else if (!obj.NeedInput && !dicItem.ItemId) {
            //                     this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
            //                     return;
            //                 }
            //             }
            //         }

            //     }
            // }
            
           
            // if (ApproveOrigin.OriginType === 1 && ApproveOrigin.ProjectId === '0') {
            //     let proLablel = customerInfo.Setting.ProjectLabel ? customerInfo.Setting.ProjectLabel : '项目出差';
            //     this.toastMsg('请选择' + proLablel);
            //     return;
            // }
            // if (ApproveOrigin.OriginType === 3 && ApproveOrigin.ApproverId === '0') {
            //     this.toastMsg('请选择授权人');
            //     return;
            // }
        }
        let GrabSelectTrains=[];
        setOptions.push(ticket.selectedSeat.seat)
        let obj = {};
        let setOptionsArr = setOptions.filter(function (item, index, arr) {
                        return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
                    });
        setSelects&&setSelects.map((item)=>{
            let seatArr = []
            item.ticketTypes.map((ticketTypes_item)=>{
                setOptionsArr.map((set_item)=>{
                    if(set_item==ticketTypes_item.seat){//找到 选择的席位 是车次中包含的席位
                        seatArr.push(ticketTypes_item);//将符合的席位的相关信息放入数组
                    }
                })
            })
            const returnSeatArr = 
                  seatArr.map(item_obj => ({ 
                        Checi: item.train_code,
                        FromStationCode: item.from_station_code,
                        FromStationName: item.from_station_name,
                        ToStationName: item.to_station_name,
                        ToStationCode: item.to_station_code,
                        Zwname: item_obj.seat,
                        StartTime: item.start_time,
                        ArriveTime: item.arrive_time,
                        Price: item_obj.price,
                        RunTime: item.run_time,
                        ArrivalCityCode: ticket.SearchToCity && ticket.SearchToCity.toCityCode,
                        ArrivalCity: ticket.SearchToCity && ticket.SearchToCity.toCityName,
                        DepartureCity: ticket.SearchFromCity && ticket.SearchFromCity.fromCityName,
                        DepartureCityCode: ticket.SearchFromCity && ticket.SearchFromCity.fromCityCode
                  }))
            returnSeatArr.map((train_info)=>{
                GrabSelectTrains.push(train_info)                
            }) 
        })
        let ticketTime = ticket&&ticket.departureDate.format('yyyy-MM-dd');
        let selectOptionCopy =selectOption? JSON.parse(JSON.stringify(selectOption)):[] ;
            selectOptionCopy.push(ticketTime);//选票 在选择数组中添加当前选票时间
        let selectData = selectOptionCopy&&selectOptionCopy.join(',')
        let destinationTime = ticket.departureDate.addDays(+ticket.arrive_days);
        if (diffDicList && this.props.feeType === 1) {
            const visibleCompanyIdSet = getVisibleEmployeeDictIdSet(diffDicList, customerInfo.DictMapList, AdditionInfo && AdditionInfo.DictItemList);
            for (let i = 0; i < diffDicList.length; i++) {
                const obj = diffDicList[i];
                if (!visibleCompanyIdSet.has(obj.Id)) {
                    continue;
                }
                let dicItem = AdditionInfo&&AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item => 
                    item.DictCode === obj.Code
                    // obj.NeedInput ? item.DictName === obj.Name : item.DictId === obj.Id
                );
                let regex=new RegExp(dicItem?.FormatRegexp)
                const isCascadeChild = obj.BeforeParentNameList && obj.BeforeParentNameList.length > 0;
                if (obj.IsRequire && (obj.ShowInOrder || isCascadeChild)) {
                    if (!dicItem) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                        return;
                    } else {
                        if (obj.NeedInput && !dicItem.ItemName) {
                            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                            return;
                        } else if (!obj.NeedInput && !dicItem.ItemId) {
                            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                            return;
                        }                         
                    }
                }
                if(dicItem?.ItemName && dicItem?.FormatRegexp&&!regex.test(dicItem.ItemName)){
                    // this.toastMsg(dicItem.DictName+'格式不符合规则');
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}格式不符合规则', I18nUtil.translate(Util.Parse.isChinese()?dicItem.DictName:dicItem.DictEnName)));
                    return;
                }
            }
        }
        let referencEmployeeId;
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }
        const setting = customerInfo.Setting;
        if(setting&&setting.AttachmentConfig&&setting.AttachmentConfig.TrainNecessary){
            if(fileList.length==0){
                this.toastMsg('未上传附件');
                return;
            }
        }
        let AttachmentModel = {
            AttachmentItems:fileList
        }
        const dictConfigList = customerInfo && Array.isArray(customerInfo.DictList) ? customerInfo.DictList : [];
        const trainDictConfigs = dictConfigList.filter(cfg => cfg && (cfg.BusinessCategory & 8));
        const existCompanyDictItemList = AdditionInfo && Array.isArray(AdditionInfo.DictItemList) ? AdditionInfo.DictItemList : [];
        const nullCompanyDictList = trainDictConfigs.map((item) => ({
            DictCode: item.Code,
            DictEnName: item.EnName,
            DictId: item.Id,
            DictName: item.Name,
            FormatRegexp: item.FormatRegexp,
            Id: item.Id,
            ItemEnName: null,
            ItemId: "",
            ItemInput: "",
            ItemName: "",
            NeedInput: item.NeedInput,
            Remark: item.Remark,
            RemarkNo: item.RemarkNo,
            NextId: item.NextId,
            ShowInOrder: item.ShowInOrder,
            BusinessCategory: item.BusinessCategory,
        }));
        existCompanyDictItemList.forEach((it) => {
            if (!it) return;
            const dictId = it.DictId || it.Id;
            let index = -1;
            if (dictId !== undefined && dictId !== null) {
                index = nullCompanyDictList.findIndex(e => e && (e.Id == dictId || e.DictId == dictId));
            }
            if (index === -1 && it.DictCode !== undefined) {
                index = nullCompanyDictList.findIndex(e => e && e.DictCode == it.DictCode);
            }
            if (index > -1) {
                const base = nullCompanyDictList[index];
                nullCompanyDictList[index] = {
                    ...base,
                    ...it,
                    Id: base.Id,
                    DictId: base.DictId,
                    DictCode: base.DictCode,
                    DictName: base.DictName,
                    DictEnName: base.DictEnName,
                    NeedInput: base.NeedInput,
                    NextId: base.NextId,
                    ShowInOrder: base.ShowInOrder,
                    FormatRegexp: base.FormatRegexp,
                    Remark: base.Remark,
                    RemarkNo: base.RemarkNo,
                    BusinessCategory: base.BusinessCategory,
                };
            }
        });
        const childIdSet = new Set();
        trainDictConfigs.forEach((cfg) => {
            if (cfg && cfg.NextId) childIdSet.add(cfg.NextId);
        });
        const visibleCompanyIdSet = getVisibleEmployeeDictIdSet(trainDictConfigs, customerInfo && customerInfo.DictMapList, nullCompanyDictList);
        if(InvoiceInfo){
            InvoiceInfo.ReceiveEmail = ReceiveEmail
        }
        AdditionInfo.DictItemList = nullCompanyDictList.filter((it) => {
            const dictId = it && (it.DictId || it.Id);
            if (!dictId) return false;
            if (!childIdSet.has(dictId)) return true;
            return visibleCompanyIdSet && visibleCompanyIdSet.has(dictId);
        })
        
        let emailArr2 = Contact?.Email?.split(';').filter(item => item);
        if(emailArr2?.length>4){
            this.toastMsg('联系人邮箱最多维护4个');
            return;
        }
        if(emailArr2?.length>0){
            for (const item of emailArr2) {
                if (!Util.RegEx.isEmail(item)) {
                    this.toastMsg('请输入正确的邮箱格式');
                    return;
                }
            }
        }
        let PassengerList = this._getPassengerList();
        if (!PassengerList) {
            return;
        }
        let requestModel = {
            Is12306Login:customerInfo&&customerInfo.Setting&&customerInfo.Setting.IsShowBind12306?(login12306Data==0?false:true):false,//添加是否关联12306状态
            PassengerList: PassengerList,
            ApproveOrigin: ApproveOrigin,
            AdditionInfo: AdditionInfo,
            Platform: Platform.OS,
            IgnoreConfirm: 0,
            IsNightConfirm: false,
            IsChooseSeats: selectSeat.length === 0 ? false : true,
            ChooseSeats: selectSeat.join(','),
            VipServiceCharge: customerInfo.TrainVipServiceCharge,
            ServiceCharge: customerInfo.TrainServiceCharge,
            FeeType: this.props.feeType,
            IsAcceptStanding: isReceiveNoSeat,
            OrderTrain: {
                EmployeeTrainAccountId:customerInfo&&customerInfo.Setting&&customerInfo.Setting.IsShowBind12306?login12306Data:null,//用户的12306返回data
                Price: TrainPrice?TrainPrice:ticket.selectedSeat.price,//切换最高价
                TotalPeople: 1,
                Contact: Contact,
                Attachment:AttachmentModel,
                TrainRcReason: ticket.RcReason && ticket.RcReason.Reason ? 
                    {
                        CustomerReasonId: ticket.RcReason ? ticket.RcReason.Id : '',
                        Reason: ticket.RcReason.Reason,
                        RuleType: 4,
                        OrderCategory: 5,
                        ReasonCode:ticket.RcReason ? ticket.RcReason.ReasonCode : '',
                    }
                    :null
                   ,
                TrainInfo: {
                    Checi: ticket.train_code,
                    FromStationCode: ticket.from_station_code,
                    FromStationName: ticket.from_station_name,
                    ToStationName: ticket.to_station_name,
                    ToStationCode: ticket.to_station_code,
                    Zwname: ticket.selectedSeat.seat,
                    TrainDate: ticket.departureDate.format('yyyy-MM-dd', true),
                    ArriveDate: destinationTime.format('yyyy-MM-dd', true),
                    StartTime: ticket.start_time,
                    ArriveTime: ticket.arrive_time,
                    Price: ticket.selectedSeat.price,
                    RunTime: ticket.run_time,
                    TicketType: '1',//默认为成人票种
                    ArrivalCityCode: ticket.SearchToCity && ticket.SearchToCity.toCityCode,
                    ArrivalCity: ticket.SearchToCity && ticket.SearchToCity.toCityName,
                    DepartureCity: ticket.SearchFromCity && ticket.SearchFromCity.fromCityName,
                    DepartureCityCode: ticket.SearchFromCity && ticket.SearchFromCity.fromCityCode,
                    TrainNo: ticket.train_no
                },
                ApplyId: this.props.apply ? this.props.apply.Id : 0,
                JourneyId:this.params.JourneyId,
                IsGrabTicketOrder:seat===0?true:false,//是否为抢票单
                GrabSelectTrains:GrabSelectTrains,
                GrabTrainDate:selectData.replace(/\//g,"-"),//所选抢票日期
                GrabEndTime: diedlineTime.replace(/\//g,"-"),//抢票截止时间
                DeadLineHour:flag,//抢票发车前n小时截至
                ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                ReferencePassengerId:referencEmployeeId,
            },
            ElectronicItineraryInfo:InvoiceInfo,
           
        }
        PassengerList&&PassengerList.forEach(item => {
            item.Certificate = item.Credentials;
        })
        let params = Object.assign({ requestModel, from: 'train', 
                                     totalPrice: this._calcuTotalPrice(0), PassengerList }, 
                                     this.params, this.state, {diedlineTime:diedlineTime, VipServiceCharge: ServiceFeesData.VipServiceFees,
                                        ServiceCharge: ServiceFeesData.ServiceFees,
                                     selectData:selectOptionCopy});

        // this.getTravellerUpdateCheck(PassengerList,ApproveOrigin,ticket,params);
        this._getApproveInfo(PassengerList,ApproveOrigin,ticket,params);  
    }
    getTravellerUpdateCheck = (PassengerList,ApproveOrigin,ticket,params) => {
        let model = {
            OrderCategory: 5,
            Travellers: PassengerList
        }
        let Travellerarr = []
        PassengerList?.forEach((item,index) => {
            Travellerarr.push(
                Util.Parse.isChinese()?
                "第"+(index+1)+'位'+'： '+item?.Name+'\n'+'证件类型：'+Util.Read.typeTocertificate2(item?.Certificate?.Type)+'\n'+"证件号码："+Utils.Read.simpleReplace(item?.Certificate?.SerialNumber)+"\n\n"
                :
                (index+1)+'th'+'： '+item?.Name+'\n'+'Certificate Type：'+Util.Read.typeTocertificate2(item?.Certificate?.Type)+'\n'+'Certificate Number：'+Utils.Read.simpleReplace(item?.Certificate?.SerialNumber)+"\n\n"
            )
        })
        this.showLoadingView();
        CommonService.MassOrderTravellerUpdateCheck(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                let massage = response.data ? Util.Parse.isChinese() ? '订单提交后旅客信息会更新，请您及时通知旅客本人\n\n' : 'Passenger info will update after submission. Please notify the passenger promptly.\n\n' : '';
                let masseges = massage+Travellerarr
                this.showAlertView(masseges, () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                    }, '确定', () => {
                        this.dismissAlertView(); 
                        this._getApproveInfo(PassengerList,ApproveOrigin,ticket,params);
                    })
                })
            } else {
                this._getApproveInfo(PassengerList,ApproveOrigin,ticket,params);
            }
        }).catch(error => {
            this.hideLoadingView();
            this._getApproveInfo(PassengerList,ApproveOrigin,ticket,params);
        });
    }
    _getApproveInfo = (PassengerList,ApproveOrigin,ticket,params) => {
        if (this.props.feeType === 2) {
            this.push('TrainOrderSure', params);
            return;
        }
        let approveInfo = {
            PassengerList: PassengerList,
            ApproveOrigin: ApproveOrigin,
            BusinessType: 4,
            IsNeedApproval: (ticket.ViolationMode == 2 && ticket.IsCheckSeat == 1 && ticket.selectedSeat.checkSeat === 0) ? true : false,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        }
        this.showLoadingView();
        CommonService.ApproveInfo(approveInfo).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                params.ApproveList = response.data;
                this._toNextJudge(params);
            } else {
                this._toNextJudge(params);
            }

        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取审批人信息失败');
        })
    }

    _toNextJudge = (params) => {
        this.push('TrainOrderSure', params);
    }
    /**
    * 获取乘客列表
    */
    _getPassengerList = () => {
        const { employees,travellers } = this.state;
        let passengerList = [];
        const hasInvalidEnName = employees.some(item => {
            let CHName = item.CertificateType==="身份证" || item.CertificateType==="Chinese ID Card" || ((item.CertificateType==="海员证" || item.CertificateType==="Seaman's Book")&&item.NationalCode==="CN")|| item.CertificateType==="港澳台居民居住证"|| item.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents"
            let CHName2 = (item.CertificateType==="护照" || item.CertificateType==="Passport") && item.NationalCode==="CN"
            let selectCn = !item.selectEn && Utils.Read.certificateType2(item.CertificateType) === 128
            if (CHName || CHName2 || selectCn){
                return false
            }else{
                if(item.Surname && item.GivenName && Util.RegEx.isEnName(item.Surname)) return true;
                if(item.Surname && item.GivenName && Util.RegEx.isEnName(item.GivenName)) return true;
            }
            return false;
        });
        if (hasInvalidEnName) {
            this.toastMsg('英文名称只能包含字母');
            return;
        }
        employees.forEach(item => {
             let CHName = item.CertificateType==="身份证" || item.CertificateType==="Chinese ID Card" || ((item.CertificateType==="海员证" || item.CertificateType==="Seaman's Book")&&item.NationalCode==="CN")|| item.CertificateType==="港澳台居民居住证"|| item.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents"
             let CHName2 = (item.CertificateType==="护照" || item.CertificateType==="Passport") && item.NationalCode==="CN"
             let selectCn = !item.selectEn && Utils.Read.certificateType2(item.CertificateType) === 128
             let UseEnglish = !(CHName || CHName2 || selectCn);
             if(!Util.Parse.isChinese()){
                 function formatDate(date) {
                     const year = date.getFullYear();
                     const month = String(date.getMonth() + 1).padStart(2, '0');
                     const day = String(date.getDate()).padStart(2, '0');
                     return `${year}-${month}-${day}`;
                 }
                 item.Expire = formatDate(new Date(item.Expire));
             }
             passengerList.push({
                Sex: item.Gender?item.Gender:item.Sex,
                Gender: item.Gender?item.Gender:item.Sex,
                Name:item.Name,
                LastName: item.Surname,
                FirstName: item.GivenName,
                Surname: item.Surname,
                GivenName: item.GivenName,
                Birthday: item.Birthday,
                Mobile: item.Mobile,
                Status: item.Status,
                IsVip: item.IsVip,
                DepartmentName: item.DepartmentName,
                Addition:item.Addition?item.Addition:item.AdditionInfo?item.AdditionInfo:null,
                AdditionInfo:item.AdditionInfo,
                Email:item.Email,
                NationalName:item. NationalName?item. NationalName:item.Nationality,
                NationalCode:item.NationalCode?item.NationalCode:item.NationalityCode,
                Nationality:item.NationalCode?item.NationalCode:item.NationalityCode,
                Credentials: {
                    Type: Util.Read.certificateType(item.CertificateType),
                    TypeDesc: item.CertificateType,
                    Birthday: item.Birthday,
                    SerialNumber: item.CertificateNumber,
                    NationalName:item. NationalName?item. NationalName:item.Nationality,
                    NationalCode:item.NationalCode?item.NationalCode:item.NationalityCode,
                    IssueNationCode: item.NationalCode?item.NationalCode:item.NationalityCode,
                    IssueNationName: item. NationalName?item. NationalName:item.Nationality,
                    Expire: item.Expire,
                    Sex: item.Gender?item.Gender:item.Sex,
                    UseEnglish:UseEnglish
                },
                PiaoType: {
                    Type: 1
                },
                PassengerOrigin: item.PassengerOrigin
                // {
                //     Type: 1,
                //     EmployeeId: item&&item.PassengerOrigin&&item.PassengerOrigin.EmployeeId,
                //     TravellerId: 0
                // }
            });
        });
        const hasInvalidTravellerName = travellers.some(item => {
            let CHName = item.CertificateType==="身份证" || item.CertificateType==="Chinese ID Card" || ((item.CertificateType==="海员证" || item.CertificateType==="Seaman's Book")&&item.NationalCode==="CN")|| item.CertificateType==="港澳台居民居住证"|| item.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents"
            let CHName2 = (item.CertificateType==="护照" || item.CertificateType==="Passport") && item.NationalCode==="CN"
            let selectCn = !item.selectEn && Utils.Read.certificateType2(item.CertificateType) === 128
            if (CHName || CHName2 || selectCn){
                return false
            }else{
                if(item.Surname && item.GivenName && Util.RegEx.isEnName(item.Surname)) return true;
                if(item.Surname && item.GivenName && Util.RegEx.isEnName(item.GivenName)) return true;
            }
            return false;
        });
        if (hasInvalidTravellerName) {
            this.toastMsg('英文名称只能包含字母');
            return;
        }
        travellers.forEach(item => {
            let EnName = Util.Read.certificateType2(item?.CertificateType || 0) === 1024 ||  
                Util.Read.certificateType2(item?.CertificateType || 0) === 128 || 
                (Util.Read.certificateType2(item?.CertificateType || 0) === 2 && item.NationalCode !== 'CN') 
            let LastName = item.LastName?item.LastName:item.Surname
            let FirstName = item.FirstName?item.FirstName:item.GivenName
            let myEnName = LastName+"/"+FirstName
            let CHName = item.CertificateType==="身份证" || item.CertificateType==="Chinese ID Card" || ((item.CertificateType==="海员证" || item.CertificateType==="Seaman's Book")&&item.NationalCode==="CN")|| item.CertificateType==="港澳台居民居住证"|| item.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents"
            let CHName2 = (item.CertificateType==="护照" || item.CertificateType==="Passport") && item.NationalCode==="CN"
            let selectCn = !item.selectEn && Utils.Read.certificateType2(item.CertificateType) === 128
            let UseEnglish = !(CHName || CHName2 || selectCn);
            if(!Util.Parse.isChinese()){
                function formatDate(date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
                item.Expire = formatDate(new Date(item.Expire));
            }
            passengerList.push({
                Sex: item.Gender?item.Gender:item.Sex,
                Gender: item.Gender?item.Gender:item.Sex,
                Name: item.Name,
                LastName: item.Surname,
                FirstName: item.GivenName,
                Surname: item.Surname,
                GivenName: item.GivenName,
                Birthday: item.Birthday,
                Mobile: item.Mobile,
                // Addition:item.AdditionInfo,,
                Addition:item.Addition?item.Addition:item.AdditionInfo?item.AdditionInfo:null,
                AdditionInfo:item.AdditionInfo,
                Email:item.Email,
                NationalName:item. NationalName?item. NationalName:item.Nationality,
                NationalCode:item.NationalCode?item.NationalCode:item.NationalityCode,
                Nationality:item.NationalCode?item.NationalCode:item.NationalityCode,
                Credentials: {
                    Type: Util.Read.certificateType(item.CertificateType),
                    TypeDesc: item.CertificateType,
                    SerialNumber: item.CertificateNumber,
                    NationalName: item.NationalName,
                    NationalCode: item.NationalCode,
                    Expire: item.Expire,
                    Birthday: item.Birthday,
                    IssueNationCode: item.NationalCode?item.NationalCode:item.NationalityCode,
                    IssueNationName: item. NationalName?item. NationalName:item.Nationality,
                    Sex: item.Gender?item.Gender:item.Sex,
                    UseEnglish:UseEnglish
                },
                PiaoType: {
                    Type: 1
                },
                PassengerOrigin: {
                    Type: item.Id ? 2 : 0,
                    EmployeeId: 0,
                    TravellerId: item.Id ? item.Id : 0
                }
            });
        });
        return passengerList;
    }


    _orderValidation = () => {
        const { travellers,employees } = this.state;
        let passengerCount = travellers.length + employees.length;
        if (passengerCount === 0) {
            return '请添加乘客';

        }
        if (passengerCount > 5) {
            return '乘客最多为5人';
        }
        for (let index = 0; index < employees.length; index++) {
            const obj = employees[index];
            if (!obj.Name) {
                return I18nUtil.tranlateInsert('第{{noun}}位员工姓名不能为空', index + 1);
            }
            if (!obj.Mobile) {
                return I18nUtil.tranlateInsert('第{{noun}}位员工手机号不能为空', index + 1);
            }
            if (!obj.CertificateNumber || !obj.CertificateType) {
                return I18nUtil.tranlateInsert('第{{noun}}位员工证件信息不完整', index + 1);
            }
            if (!obj.SexDesc && !obj.Sex && !obj.Gender) {
                return I18nUtil.tranlateInsert('第{{noun}}位员工性别不能为空', index + 1);
            }
            if (obj.CertificateType === '外国人永久居留身份证' || obj.CertificateType === '台湾居民来往大陆通行证' || obj.CertificateType === '港澳居民来往内地通行证') {
                if (!obj.Birthday) {
                    return I18nUtil.tranlateInsert('第{{noun}}位员工出生日期不能为空', index + 1);
                }
                if (!obj.Expire && !obj.CertificateExpire) {
                    return I18nUtil.tranlateInsert('第{{noun}}位员工证件有效期不能为空', index + 1);
                }
            }
            if (obj.CertificateType === '护照' || obj.CertificateType === '外国人永久居留身份证') {
                if (!obj.NationalName) {
                    return I18nUtil.tranlateInsert('第{{noun}}位员工国家地区不能为空', index + 1);
                }
            }
        }
        for (let index = 0; index < travellers.length; index++) {
            const obj = travellers[index];
            if (!obj.Name) {
                return I18nUtil.tranlateInsert('第{{noun}}位常旅客姓名不能为空', index + 1);
            }
            if (!obj.Mobile) {
                return I18nUtil.tranlateInsert('第{{noun}}位常旅客手机号不能为空', index + 1);
            }
            if (!obj.CertificateNumber || !obj.CertificateType) {
                return I18nUtil.tranlateInsert('第{{noun}}位常旅客证件信息不完整', index + 1);
            }
            if (!obj.SexDesc && !obj.Sex && !obj.Gender) {
                return I18nUtil.tranlateInsert('第{{noun}}位常旅客性别不能为空', index + 1);
            }
            if (obj.CertificateType === '外国人永久居留身份证' || obj.CertificateType === '台湾居民来往大陆通行证' || obj.CertificateType === '港澳居民来往内地通行证') {
                if (!obj.Birthday) {
                    return I18nUtil.tranlateInsert('第{{noun}}位常旅客出生日期不能为空', index + 1);
                }
                if (!obj.Expire && !obj.CertificateExpire) {
                    return I18nUtil.tranlateInsert('第{{noun}}位常旅客证件有效期不能为空', index + 1);
                }
            }
            if (obj.CertificateType === '护照' || obj.CertificateType === '外国人永久居留身份证') {
                if (!obj.NationalName) {
                    return I18nUtil.tranlateInsert('第{{noun}}位常旅客国家地区不能为空', index + 1);
                }
            }
        }
    }

    /**
     *  关于卧铺提示
     */
    _renderWoPuTip = () => {
        if (this.state.showTip) {
            let tipTxt = '火车票卧铺上\中\下是随机分配的，价格为下铺价。预订按实际铺席收费。';
            return (
                <View style={{ backgroundColor:Theme.theme, padding: 10, flexDirection: 'row', }}>
                    {/* <Image style={{ width: 15, height: 15, tintColor: '#ff7a03' }} source={require('../../../res/image/iconFont/notice_icon.png')} /> */}
                    <EvilIcons name={'bell'} size={20} color={'#ff7a03'} />
                    <CustomText style={{ flex: 1, fontSize: 13, marginHorizontal: 5 }} numberOfLines={10} text={tipTxt} />
                    <TouchableOpacity onPress={() => this.setState({ showTip: false })}>
                        <CustomText style={{ color: Theme.theme, fontSize: 13 }} text='关闭' />
                    </TouchableOpacity>
                </View>
            );
        }
        return null;
    }
    /**关联12306 */
    _renderRelate =()=>{
        const{login12306Name, relateYn,loginSuccess}=this.state;
        return(
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:10,alignContent:'center'}}>  
            <View style={{flexDirection:'row',alignItems:'center'}}>
                <ImageBackground style={{width:28,height:28}} source={require('../../res/image/pic_railway.png')}/>
                {login12306Name?
                <View style={{flexDirection:'row',flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center',flex:4}}>
                        <CustomText style={{fontSize:14,marginLeft:10}} text={login12306Name}/>
                        <CustomText style={{fontSize:12,marginLeft:10,color:Theme.theme}} text={'已关联'}/>
                    </View>
                    <View style={{flexDirection:'row',alignItems:'center',flex:3}}>
                        <TouchableOpacity onPress={this._logoutClick} style={{height:30,backgroundColor:Theme.theme,borderRadius:4,justifyContent:'center',alignItems:'center'}}>
                            <CustomText style={{fontSize:15,color:'#fff',paddingHorizontal:10}} text={'退出'}></CustomText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this._relateClick2} style={{height:30,backgroundColor:Theme.theme,borderRadius:4,justifyContent:'center',alignItems:'center',marginLeft:5}}>
                            <CustomText style={{fontSize:15,color:'#fff',paddingHorizontal:10}} text={'切换'}></CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
                :
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <View style={{width:230,marginLeft:10}}>
                        <CustomText style={{fontSize:14,fontWeight:'bold'}} text='铁路局规定购票必须实名制'/>
                        <CustomText style={{marginTop:5,fontSize:12,}} text='登录12306账号提高出票成功率' />
                    </View>
                    <TouchableOpacity onPress={this._relateClick1} style={{right:10,height:30,backgroundColor:Theme.theme,borderRadius:4,justifyContent:'center',alignItems:'center'}}>
                            <CustomText style={{fontSize:15,color:'#fff',paddingHorizontal:10}} text={'关联'}></CustomText>
                    </TouchableOpacity>
                </View>
                }
            </View>
         </View> 
        )
    }
     //退出绑定12306
     _logoutClick =() =>{
        this.showLoadingView();
        const {login12306Name, login12306Data} = this.state;
        let model = {
                trainAccount:login12306Name, 
        }
        TrainService.TrainAccountCancelApp(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                StorageUtil.removeKey('login12306Data'); 
                this.setState({
                    login12306Name:null,
                    login12306Data:null
                })
            } else {
                this.toastMsg(response.message || '退出12306账号失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '退出12306账号异常');
        })
      
    }

    _relateClick1= ()=>{
        this.push('TrainRelateScreen',{callBack:(name,passWord,data)=>{
            this.setState({
                login12306Name:name,
                passWord:passWord,
                login12306Data:data
            })
        }})
    }
    _relateClick2= ()=>{
        this.push('TrainRelateScreen',{_switch:true, callBack:(name,passWord,data)=>{
            this.setState({
                login12306Name:name,
                passWord:passWord,
                login12306Data:data
            })
        }})
    }
   
    /**推荐备选日期  推荐选票日前后两日有效期 */
    _selecetData = (ticket) => {
        let day_data = 24*3600*1000
        let ticketTime = (ticket&&ticket.departureDate).valueOf();
        var nowDate = new Date();
        var cha = nowDate.valueOf()-ticketTime//当天减去选票发车的日期
        var chadays = Math.floor(cha/day_data)//转换成天数
        let option =[];
        if(chadays==-1){
            option.push((new Date(ticketTime+day_data*chadays)).format('yyyy/MM/dd'));
        }else if(chadays<=-2){
            option.push((new Date(ticketTime+day_data*(-2))).format('yyyy/MM/dd'));
            option.push((new Date(ticketTime+day_data*(-1))).format('yyyy/MM/dd'));
        }
        for (let index = 1; index <3; index++) {
            option.push((new Date(ticketTime+day_data*index)).format('yyyy/MM/dd'));
        }
        this.setState({
            options: option
        }, () => {
            this.actionSheet.show();
        })
    }

    /**筛选席位的点击事件 */
    _selectSet = () =>{
        if(this.state.setType&&this.state.setType.length>0){
                this.actionSheet2.show();
        }
    }
    _selectTrainNum = () =>{
        const{recommendTrain,ticket}=this.params
        const{setOptions} = this.state
        this.setState({
            setSelects:[ticket&&ticket]
        })
        this.push('TrainNumListScreen',{recommendTrain:recommendTrain,
                                        multSelectItems:this.state.multSelectItems,
                                        setType:this.state.re_setType,
                                        TrainDiedline:this.state.re_TrainDiedline,
                                        setSelects:this.state.re_setSelects,
                   callBack:(trainCodes,setType,TrainDiedline,setSelects)=>{ 
            setType.map((item)=>{
                this.state.setType.push(item);
            })
            //去重复
            let obj = {};
            let newArr = this.state.setType.filter(function (item, index, arr) {
                return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
            });
            //本身已选车次筛除
            function isMinNum(data_item) {
                return (data_item[0] != ticket.selectedSeat.seat);
              }
            let returnSetType = newArr.filter(isMinNum);
            let returnsetSelects;
            if(setSelects&&setSelects.length>0){
                setSelects.map((item)=>{
                    this.state.setSelects.push(item)
                })
                let obj2 = {};
                returnsetSelects = this.state.setSelects.filter(function (item, index, arr) {
                    return obj2.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj2[typeof item + JSON.stringify(item)] = true);
                }); 
            }else{
                returnsetSelects = [ticket&&ticket]
            }
            setOptions.push(ticket.selectedSeat.seat)
            let obj3 = {};
            let setOptionsArr = setOptions.filter(function (item, index, arr) {
                        return obj3.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj3[typeof item + JSON.stringify(item)] = true);
                    });
            let seatArr = [];
            returnsetSelects&&returnsetSelects.map((item)=>{
                
                item.ticketTypes.map((zuoxi_item)=>{
                    setOptionsArr&&setOptionsArr.map((setO_item)=>{
                       if(zuoxi_item.seat==setO_item){
                          seatArr.push(zuoxi_item.price)
                       }
                    })
                })
            })
            let Max_trainPrice = Math.max(...seatArr)
            this.setState({
                multSelectItems:trainCodes,   
                trainCodeList:trainCodes,
                setType:returnSetType,
                TrainDiedline:TrainDiedline,
                TrainPrice:Max_trainPrice,
                setSelects:returnsetSelects,
                re_setType:setType,
                re_TrainDiedline:TrainDiedline,
                re_setSelects:setSelects
          }); 
        }});
    }
    checkCallBack = (id,value) => {
        this.setState({
            flag: id,
        });
    };
    /**抢票选择备选日期后的数据 */
    _handlePress =(listItem)=>{
      this.setState({
        selectOption:listItem
      })
    }
    _handleSetPress =(item)=>{
      const{ticket} = this.params; 
      const{setOptions ,setSelects} = this.state; 
      this.setState({
        setOptions:item
      })
      let setOption_arr=[]
      setOption_arr.push(ticket.selectedSeat.seat)
      setOption_arr.push(...item)
      let obj = {};
      let setOptionsArr = setOption_arr.filter(function (item, index, arr) {
                  return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
      });
      let returnsetSelects; 
      if(!(setSelects&&setSelects.length>0)){
        setOptions.push(ticket.selectedSeat.seat)
        returnsetSelects=[ticket&&ticket];
      }else{
        returnsetSelects= setSelects
      }
        let seatArr = [];
        returnsetSelects&&returnsetSelects.map((item)=>{
            item.ticketTypes.map((zuoxi_item)=>{
                setOptionsArr&&setOptionsArr.map((setO_item)=>{
                    if(zuoxi_item.seat==setO_item){
                    seatArr.push(zuoxi_item.price)
                    }
                })
            })
        })
       let Max_trainPrice = Math.max(...seatArr) 
       this.setState({
        TrainPrice:Max_trainPrice
       })      
    }
    /**抢票时显示需要填写的内容 */
    _renderGrabVotes = (ticket,seat) => {
        const{selectOption,trainCodeList,setOptions,TrainDiedline,flag}=this.state;
        let diedLineArr = [2,3,4];//开车前几小时停止买票
        function sortDownDate(a, b) {
            return Date.parse(a) - Date.parse(b);
        }
        selectOption&&selectOption.sort(sortDownDate);//给选择的抢票日期排序
        TrainDiedline&&TrainDiedline.sort(function(a,b) {//给选择的抢票车次时间排序
            var qq =a.split(":")
            var dd =b.split(":")
            return (parseInt(qq[0])*60+parseInt(qq[1]))-(parseInt(dd[0])*60+parseInt(dd[1]));
        });
        let ticketTime = ticket&&ticket.departureDate.format('yyyy/MM/dd');
        var newSplicing2=`${ticketTime}${' '}${ticket&&ticket.start_time}${':00'}` 
        var date2 = new Date(newSplicing2);
        var t = date2.getTime();
        t -= 3600000*flag;//减1个小时就是3600000毫秒
        date2 = new Date(t);
        if(selectOption&&selectOption[0]){
            if(TrainDiedline&&TrainDiedline[0]){
                var newSplicing=`${selectOption[0]}${' '}${TrainDiedline[0]}${':00'}`
                var date = new Date(newSplicing);
                var t = date.getTime();
                t -= 3600000*flag;//减1个小时就是3600000毫秒
                date = new Date(t);
                diedlineTime = Util.formatDate(date>date2?date2:date,'yyyy/MM/dd hh:mm')
            }else{
                var newSplicing=`${selectOption[0]}${' '}${ticket&&ticket.start_time}${':00'}`
                var date = new Date(newSplicing);
                var t = date.getTime();
                t -= 3600000*flag;//减1个小时就是3600000毫秒
                date = new Date(t);
                diedlineTime = Util.formatDate(date>date2?date2:date,'yyyy/MM/dd hh:mm')
            }
        }else{
            if(TrainDiedline&&TrainDiedline[0]){
                var newSplicing=`${ticketTime}${' '}${TrainDiedline[0]}${':00'}`
                var date = new Date(newSplicing);
                var t = date.getTime();
                t -= 3600000*flag;//减1个小时就是3600000毫秒
                date = new Date(t);
                diedlineTime = Util.formatDate(date>date2?date2:date,'yyyy/MM/dd hh:mm')
            }else{
               diedlineTime = Util.formatDate(date2,'yyyy/MM/dd hh:mm')
            }
        }
        
        let train_code = ticket&&ticket.train_code;
        let selectedSeat = ticket&&ticket.selectedSeat.seat
        function isMinNum(data_item) {
            return (data_item != selectedSeat);
          }
        let selectedSeatArr = setOptions&&setOptions.filter(isMinNum);
        

        return(
            seat===0?//判断无票状态下显示抢票
            <View>
                <TouchableHighlight underlayColor='transparent' onPress={()=>{this._selecetData(ticket)}}>
                    <View style={styles.bxStyle}>
                        <View style={{flexDirection:'row'}}>
                        <CustomText text={'备选日期'} />
                        <CustomText style={{marginLeft:10 ,color:Theme.fontColor,width:screenWidth-100}}  
                                    text={ticketTime+(selectOption&&selectOption.length>0?"、"+selectOption.join('、'):'')} />
                        </View>
                        <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                    </View>
                </TouchableHighlight>
                <TouchableHighlight underlayColor='transparent' onPress={this._selectTrainNum}>
                    <View style={styles.bxStyle}>
                        <View style={{flexDirection:'row'}}>
                        <CustomText text={'备选车次'} />
                        <CustomText style={{marginLeft:10,color:Theme.fontColor}} 
                                    text={train_code+(trainCodeList&&trainCodeList.length>0?"、"+trainCodeList.join('、'):'')} />
                        </View>
                        <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                    </View>
                </TouchableHighlight>
                <TouchableHighlight underlayColor='transparent' onPress={this._selectSet}>
                    <View style={styles.bxStyle}>
                        <View style={{flexDirection:'row'}}>
                            <CustomText text={'备选席位'} />
                            <CustomText style={{marginLeft:10,color:Theme.fontColor,width:screenWidth-100}} 
                                        text={selectedSeat+(selectedSeatArr.length>0?"、"+selectedSeatArr.join('、'):'')} />

                        </View>
                        <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                    </View>
                </TouchableHighlight>
            
                <View style={styles.bxStyle2}>
                    <View style={{flexDirection:'row'}}>
                      <CustomText style={{ fontWeight: 'bold' }} text={'截至抢票时间:'} />
                      {
                          diedlineTime?
                            <View style={{flexDirection:'row'}}>
                                <CustomText text={'( 我们将为您抢票至'} />
                                <CustomText style={{color:Theme.theme }} text={diedlineTime} />
                                <CustomText text={'为止。)'} />
                            </View>
                          :null
                      }
                      
                    </View>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',backgroundColor:'#fff',marginBottom:1}}>
                    <TrainRadioView  id={1} value2={1} onCheck={this.checkCallBack} radius={1} value={1}
                                bgc='red' checked={this.state.flag === 1} text = {'开车前1小时'}/>
                    {diedLineArr.map((item, index) => {
                        return (
                            <TrainRadioView key={index}  id={index+2} value2={diedLineArr[index]} onCheck={this.checkCallBack} radius={16} value={12}
                                bgc='yellow' checked={this.state.flag === item} text ={'开车前'+item+'小时'}/>
                            );
                        }
                    )}
                </View>
                
            </View>:null
        )
       
    }
    _renderReceiveNoseat = () => {
        const { ticket } = this.params;
        if (ticket.selectedSeat && (ticket.selectedSeat.seat === '二等座' || ticket.selectedSeat.seat === '二等座')) {
            return (
                <TouchableHighlight style={{ marginTop: 10 }} underlayColor='transparent' onPress={() => { this.setState({ isReceiveNoSeat: !this.state.isReceiveNoSeat }) }}>
                    <View style={{ flexDirection: 'row', backgroundColor: 'white', padding: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                        <CustomText style={{ color: '#999', fontSize: 15 }} text='接受无座' />
                        <MaterialIcons
                            name={this.state.isReceiveNoSeat ? 'check-box' : 'check-box-outline-blank'}
                            size={28}
                            color={Theme.darkColor}
                        />
                    </View>
                </TouchableHighlight>
            )
        }
        return null;
    }
    _calcuTotalPrice = (isShow) => {
        const { customerInfo, employees,travellers, TrainPrice,ServiceFeesData} = this.state;
        let totalPrice = 0;
        totalPrice = (employees.length + travellers.length) * (TrainPrice?TrainPrice>this.params.ticket.selectedSeat.price?TrainPrice:this.params.ticket.selectedSeat.price:this.params.ticket.selectedSeat.price);
        
        var serviceFee = 0;
        var VipServiceFee = 0;
        var baseAmount = TrainPrice?TrainPrice>this.params.ticket.selectedSeat.price?TrainPrice:this.params.ticket.selectedSeat.price:this.params.ticket.selectedSeat.price
        if(ServiceFeesData&&ServiceFeesData.ServiceFees && ServiceFeesData.ServiceFees.length>0){
            ServiceFeesData.ServiceFees.map((item,index)=>{
                if (item.FeeValueType == 1) {
                    serviceFee += Number(item.Price);
                }
                else if (item.FeeValueType == 2) {
                    item.Price = Number((item.FeeValue * baseAmount).toFixed(2));
                    serviceFee += item.Price;
                }
            })
        } 
        if(ServiceFeesData&&ServiceFeesData.VipServiceFees && ServiceFeesData.VipServiceFees.length>0){
            ServiceFeesData.VipServiceFees.map((item,index)=>{
                if (item.FeeValueType == 1) {
                    VipServiceFee += Number(item.Price);
                }
                else if (item.FeeValueType == 2) {
                    item.Price = Number((item.FeeValue * baseAmount).toFixed(2));
                    VipServiceFee += item.Price;
                }
            })  
        }
        if (ServiceFeesData.IsShowServiceFee) {
            employees.forEach(item => {
                if (item.IsVip) {
                    totalPrice += VipServiceFee;
                } else {
                    totalPrice += serviceFee;
                }
            });
            travellers.forEach(item => {
                if (item.IsVip) {
                    totalPrice += VipServiceFee;
                } else {
                    totalPrice += serviceFee;
                }
            })
        }

        let servicePrice = totalPrice - baseAmount //用包含服务费的总价 减去 不包含服务费的总价
        let merchantPrice =ServiceFeesData?.IsShowServiceFee ? MerchantPriceUtil.merchantPrice( CommonEnum.orderIdentification.train, customerInfo, baseAmount, servicePrice, 0, this.props.feeType ) : 0
        let totalP = Number( totalPrice + merchantPrice).toFixed(2)
        if(isShow){
            return merchantPrice//刷卡手续费
        }else{
            return totalP=='NaN' ? '--' : totalP
        }  
    }
    _showPriceDetail = () => {
        if (this.state.showPriceDetail) {
            this.setState({
                showPriceDetail: false
            }, () => {
                this.priceDetailView.hide();
            })

        } else {
            this.setState({
                showPriceDetail: true
            }, () => {
                this.priceDetailView.show();
            })
        }
    }

    _handleLevel = (data,obj) => {
        data.CertificateNumber = obj&&obj.SerialNumber;
        data.Expire = obj&&obj.Expire;
        data.CertificateExpire = obj&&obj.Expire;
        data.IssueNationName = obj&&obj.IssueNationName;
        data.IssueNationCode = obj&&obj.IssueNationCode;
        data.CertificateType = obj ? obj.TypeDesc : (Utils.Parse.isChinese() ? '身份证' : 'Chinese ID Card')
        data.CertificateId = obj&&obj.Type
        return data
    }

    _getInvoice=()=>{
        const { employees } = this.state;
        this.push('InvoiceListScreen', {
            InvoicecallBack: (data) => {
                this.setState({
                    InvoiceInfo:data
                })
            },
            CustomerId: employees?.[0]?.CustomerId || null
        })
    }

    renderBody() {
        const { ticket,seat } = this.params;
        const { userInfo, employees,travellers, customerInfo, Contact, ApproveOrigin, AdditionInfo, selectSeat,options,setType,setSelects,fileList,login12306Name,login12306Data,passWord,PdfDictList,InvoiceInfo,ReceiveEmail } = this.state;
        const { feeType} = this.props;
        if(!customerInfo){return}
        let typesArr1=[];
        let typesArr2=[];
        setType&&setType.map(item => {  
            typesArr1.push(item[0])
            typesArr2.push(item[1])  
        })
        return (
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                <AdContentInfoView adList={this.state.adList} detail_ad={true}/>
                <KeyboardAwareScrollView  keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {this._renderWoPuTip()}
                    <HeaderView ticket={ticket} otwThis={this} />
                    {
                      customerInfo&&customerInfo.Setting&&customerInfo.Setting.IsShowBind12306?
                      <RelateTrainView
                        login12306Name={login12306Name}
                        login12306Data={login12306Data}
                        passWord={passWord}
                        otwThis = {this}
                      />
                      :null
                    }
                    {customerInfo && customerInfo.Setting && customerInfo.Setting.ElectronicItineraryConfig.TrainIsElectronicItinerary ? 
                        <View style={{ backgroundColor: 'white',marginHorizontal:10,borderRadius:6, paddingBottom:10,marginBottom:10}}>
                            <View style={{ backgroundColor: 'white',borderRadius:6}}>
                                <View style={{flexDirection:'row',padding:10,backgroundColor: Theme.yellowBg,borderTopLeftRadius:6,borderTopRightRadius:6}}>
                                    <CustomText style={{paddingLeft:10, color:Theme.theme}} text={'电子行程单（如发票信息开错，请联系您的差旅顾问）'} />
                                </View>
                                <TouchableHighlight underlayColor='transparent' onPress={()=>{this._getInvoice()}}>
                                    <View style={styles.section}>
                                        { 
                                          customerInfo && customerInfo.Setting.ElectronicItineraryConfig.TrainIsElectronicItineraryRequired ?
                                            <HighLight style={{}} name={'发票抬头'} /> :
                                            <CustomText style={{}} text={'发票抬头'} />
                                        }
                                        <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                                    </View>
                                </TouchableHighlight>
                            </View>
                            {
                                !InvoiceInfo?null:
                                <View style={{flexDirection:'row',backgroundColor: 'white',justifyContent:'space-between',alignItems:'center'}}>
                                    <View style={{ backgroundColor: 'white',flex:14}}>
                                        <View style={{flexDirection:'row',paddingLeft:20,paddingVertical:10,flexWrap:'wrap'}}>
                                            <CustomText style={{}} text={InvoiceInfo&&InvoiceInfo.BuyerName} />
                                            { InvoiceInfo&&InvoiceInfo.BuyerNameEn ? <CustomText style={{flexWrap:'wrap',color:Theme.assistFontColor}} text={InvoiceInfo.BuyerNameEn} /> : null }
                                        </View>
                                        <View style={{flexDirection:'row',paddingLeft:20}}>
                                            <CustomText style={{}} text={Util.Parse.isChinese()?'发票类型：':''} />
                                            <CustomText style={{}} text={InvoiceInfo&&InvoiceInfo.BuyerTypeDesc} />
                                        </View>
                                        <View style={{flexDirection:'row',paddingLeft:20,paddingVertical:10}}>
                                            <CustomText style={{}} text={Util.Parse.isChinese()?'统一社会信用代码：':''} />
                                            <CustomText style={{}} text={InvoiceInfo&&InvoiceInfo.BuyerTaxPayerId} />
                                        </View>
                                    </View>
                                    <TouchableOpacity style={{ padding:10,height:45,width:45,flex:1}} onPress={()=>{
                                        this.setState({
                                            InvoiceInfo:null
                                        })
                                    }}>
                                        <AntDesign name='delete' size={20} color={Theme.theme} ></AntDesign>
                                    </TouchableOpacity>
                                </View>
                            }
                            {
                                customerInfo?.Setting?.ElectronicItineraryConfig?.TrainNoShowReceiveEmail ? null :
                                <View style={{flexDirection:'row',paddingLeft:20,alignItems:'center'}}>
                                    { 
                                        customerInfo && customerInfo.Setting.ElectronicItineraryConfig.TrainReceiveEmailRequired ?
                                        <HighLight style={{}} name={'收件邮箱:'} /> :
                                        <CustomText style={{}} text={'收件邮箱:'} />
                                    }
                                    <CustomeTextInput style={{height:38}} placeholder='请输入邮箱' value={ReceiveEmail} onChangeText={(text) => { this.setState({ReceiveEmail:text}) }} />
                                </View>
                            }
                        </View>:null
                    } 

                    {this._renderGrabVotes(ticket,seat)}
                    <PassnegerView
                        userInfo={userInfo}
                        travellers={travellers}
                        employees={employees}
                        customerInfo={customerInfo}
                        from={'train'}
                        noComp={true}//用来标注不是综合订单
                        otwThis={this}
                        feeType={feeType}
                    />
                    <ContactView
                        from={'train'}
                        model={Contact}
                    />
                    {/* {this._renderReceiveNoseat()} */}
                    <SeatView
                        travellers={travellers}
                        employees={employees}
                        ticket={ticket}
                        selectSeat={selectSeat}
                    />
                    {
                        feeType === 1 ?
                            <View>
                                {/* <DepartView
                                    ApproveOrigin={ApproveOrigin}
                                    customerInfo={customerInfo}
                                /> */}
                                <AdditionInfoView
                                    customerInfo={customerInfo}
                                    userInfo={userInfo}
                                    AdditionIfo={AdditionInfo}
                                    ApproveOrigin={ApproveOrigin}
                                    fromNo = {8}//国内火车  BusinessCategory
                                    PdfDictList={fileList&&fileList.length>0 ? PdfDictList :null}
                                />
                                {this._renderPayType()}
                            </View>
                            : null
                    }
                    {
                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.TrainContainsAttachment//判断上传附件是否展示
                        ?
                        <View style={{marginTop:10,backgroundColor:'#fff', paddingHorizontal: 20,marginHorizontal:10,paddingVertical:10,borderRadius:6,marginBottom:10}}>
                             <TouchableOpacity  style={{flexDirection:'row',alignItems:'center', backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,justifyContent: "space-between",flexWrap:'wrap'}}
                                                onPress={()=>{this._selectFile()}}>
                                    {
                                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.TrainNecessary?
                                        <TitleView2 title={'上传附件'} required={true}></TitleView2>
                                        :
                                        <TitleView2 title={'上传附件'}></TitleView2>
                                    }
                                    {/* <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} style={{ marginLeft: 5 }} /> */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center',paddingVertical:10 }}>
                                        <TouchableOpacity style={[{ borderColor: Theme.theme }, styles.borderAll]} 
                                            onPress={()=>{
                                                this._selectFile()
                                            }}
                                        >
                                            <CustomText text='从文件夹上传' style={{color: Theme.theme }} />
                                        </TouchableOpacity>
                                        {
                                            Platform.OS === 'android'?null:
                                            <TouchableOpacity style={[{ borderColor: Theme.theme, marginLeft:5  }, styles.borderAll]} 
                                                onPress={()=>{
                                                this._selectImage()
                                                }}
                                            >
                                                <CustomText text='打开相册或相机' style={{color: Theme.theme }} />
                                            </TouchableOpacity>}
                                    </View>
                            </TouchableOpacity>
                            <View style={{ backgroundColor: 'white',justifyContent:'space-between',}}>
                                    <CustomText text={'单个文件最大5MB，数量最多5个，格式为:'} style={{fontSize:11, color:'red'}} ></CustomText>
                                    <CustomText text={'jpg,png,jpeg,bmp,gif,xlsx,xls,txt,doc,docx,md,pdf,ppt,pptx,wps;'} style={{fontSize:11, color:'red'}}></CustomText>                                  
                            </View>
                        </View>
                        :null
                    }
                    {
                       fileList.map((item,index)=>{
                            return(
                                <View style={{ flexDirection: 'row', height: 44, flex:1, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:4}}>
                                    <CustomText text={item.FileName} style={{flex:3}}></CustomText>                 
                                    <AntDesign name={'delete'} onPress={()=>{
                                        fileList.splice(index,1);
                                        this.setState({})
                                    }} size={26} color={Theme.theme} />
                                </View>  
                            )
                        })
                    }
                </KeyboardAwareScrollView>
                {this._renderFooter()}
                <PriceDetailView ref={o => this.priceDetailView = o} {...this.state} {...this.params} merchantPrice={this._calcuTotalPrice(1)} callBack={()=>{
                        this._showPriceDetail();
                 }}/>
                <CustomActionMulChoiceSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                <CustomActionMulChoiceSheet 
                          ref={o => this.actionSheet2 = o} 
                          ticket={ticket}
                          _this={this}
                          setSelects={setSelects}
                          feeType={this.props.feeType}
                          options={typesArr1}
                          chaobiao={typesArr2} 
                          onPress={this._handleSetPress} />
            </LinearGradient>

        )
    }
    /**
     * 选择文件方法
     */
    _selectFile=()=>{
        const {fileList,customerInfo,AdditionInfo} = this.state;
        if(fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        OpenGetFile.getFile(this).then(response => {
            fileList.push(response);
            this.setState({
                fileList:fileList
            },()=>{
                if(customerInfo.Setting.IsPdfAnalyze){
                    let model={
                        PdfUrl:response.Url,
                        orderCategory:CommonEnum.CategogryId.train,
                        ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
                    }
                    CommonService.AnalyzePdfDictionary(model).then(response => {
                        if (response && response.success && response.data) {
                            if (customerInfo.DictList) {
                                for (let i = 0; i < customerInfo.DictList.length; i++) {
                                    const obj = customerInfo.DictList[i];
                                    let itemIndex2 = response.data&&response.data.find(item => item.DictName == obj.Name);
                                    if(itemIndex2){
                                        itemIndex2.DictName = obj.Name
                                        itemIndex2.DictEnName = obj.EnName
                                        itemIndex2.ItemInput = itemIndex2.Value
                                        itemIndex2.ItemName = itemIndex2.Value
                                        itemIndex2.ItemEnName = itemIndex2.Value
                                        itemIndex2.Id = obj.Id
                                        itemIndex2.DictId = obj.Id
                                        itemIndex2.DictCode = obj.Code
                                        itemIndex2.NeedInput = obj.NeedInput
                                        itemIndex2.Sort = obj.Sort
                                        itemIndex2.Remark = obj.Remark
                                        itemIndex2.EnRemark = obj.EnRemark
                                        itemIndex2.ShowInOrder = obj.ShowInOrder
                                        itemIndex2.BusinessCategory = obj.BusinessCategory
                                    }
                                    if(itemIndex2){
                                        let itemIndex = AdditionInfo&&AdditionInfo.DictItemList.find(item => item.DictName == itemIndex2.DictName);
                                        if(itemIndex){
                                            AdditionInfo&&AdditionInfo.DictItemList.splice(itemIndex,1);
                                            AdditionInfo&&AdditionInfo.DictItemList.push(itemIndex2);
                                        }else{
                                            AdditionInfo&&AdditionInfo.DictItemList.push(itemIndex2);
                                        }
                                    }
                                }
                            }
                            this.setState({
                                PdfDictList:response.data,
                                AdditionInfo
                            })
                        }
                    }).catch(error => {
            
                    })
                }
            })
        })
    }

    _selectImage=()=>{
        const {fileList} = this.state;
        if(fileList&&fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        OpenGetPic.getFile(this).then(response => {
            response.data[0].FileName =  response.data[0].Name
            fileList.push(response.data[0]);
            this.setState({
                fileList:fileList,
                ImageInfo: response.imageInfo
            })
        })
    }

    _renderPayType = () => {
        const { customerInfo } = this.state;
        if (!customerInfo || !customerInfo.Setting) return null;
        return (
            <View style={{ marginTop: 10, backgroundColor: 'white', paddingHorizontal: 20, height: 44, flexDirection: 'row', alignItems: 'center',marginHorizontal:10,borderRadius:6, justifyContent: 'space-between' }}>
                <CustomText text='支付方式'/>
                <CustomText text={customerInfo.Setting.IsTrainOrderPaymentOnline ? '在线支付' : customerInfo.SettleTypeDesc} />
            </View>
        )
    }
    _renderFooter = () => {
        const { customerInfo, showPriceDetail, relateYn ,ServiceFeesData} = this.state;
        let showServiceCharge =   ServiceFeesData && ServiceFeesData.IsShowServiceFee;
        return (
            <View style={{ flexDirection: 'row', height: 45, backgroundColor: 'white' }}>
                <View style={{ marginVertical: 10, marginHorizontal: 5, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                            <CustomText style={{ marginLeft: 10, color:Theme.theme , fontSize: 16,fontWeight:'bold',marginTop:3 }} text={'¥' } />
                            <Text allowFontScaling={false} style={{ color:Theme.theme , fontSize: 20 }}>{this._calcuTotalPrice(0)}</Text>
                            {
                                showServiceCharge ? (
                                    <CustomText style={{ fontSize: 10, color: '#666' }} text='（含服务费）' />
                                ) : null
                            }
                        </View>
                    </View>
                </View>
                <View style={{  flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._showPriceDetail}>
                        <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end", alignItems: "center", height: 50  }}>
                            <CustomText style={{ fontSize: 12, color: 'gray' }} text='明细' />
                            <Ionicons name={showPriceDetail ? 'chevron-up' : 'chevron-down'} size={16} color={'gray'} style={{ marginRight: 5,marginLeft:2 }} />
                        </View>
                    </TouchableHighlight>
                    <TouchableOpacity disabled={relateYn==0?true:false} style={[{
                                                width: 120,
                                                height: 40, backgroundColor: Theme.theme,  marginRight:10,
                                                borderRadius:2, alignItems: 'center',
                                                justifyContent: 'center',
                                            }, { alignItems: 'center', justifyContent: 'center' }]} 
                        onPress={this._createOrder}>
                        <CustomText style={{ color: 'white',fontSize:16}} text='下一步' />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
}

const getStatusProps = state => ({
    feeType: state.feeType.feeType,
    apply: state.apply.apply,
    comp_userInfo: state.comp_userInfo,
    profileCommonEnum: state.profileCommonEnum
})

export default connect(getStatusProps)(TrainCreateOrderScreen);

const styles = StyleSheet.create({

    bxStyle: {
        height: 44,
        paddingHorizontal: 10,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center",
        backgroundColor:'#fff',
        marginBottom:1
        
    },
    bxStyle2: {
        height: 44,
        paddingHorizontal: 10,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center",
        backgroundColor:'#fff', 
    },
    alertStyle:{
        width: '80%', 
        backgroundColor:'#fff',
        borderRadius:8,
        padding:10,
        // height:125
        // marginTop:-250
    },
    borderAll: {
        // width: 60,
        height: 25,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: "center",
        borderRadius: 3,
        paddingHorizontal:3
    },
    section: {
        height: 44,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center",
        borderBottomWidth:1,
        borderBottomColor:Theme.normalBg,
        marginHorizontal:20
    },
    
})
