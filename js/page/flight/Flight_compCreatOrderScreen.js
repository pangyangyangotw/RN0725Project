import React from 'react';
import {
    View,
    Platform,
    StyleSheet,
    TouchableHighlight,
    DeviceEventEmitter,
    TouchableOpacity,
    Alert
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import ViewUtil from '../../util/ViewUtil';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CommonService from '../../service/CommonService';
import CommonEnum from '../../enum/CommonEnum';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Theme from '../../res/styles/Theme';
import HeaderView from './HeaderView';
import UserInfoUtil from '../../util/UserInfoUtil';
import { connect } from 'react-redux';
import ComprehPassnegerView from '../common/ComprehPassnegerView'
import Ionicons from 'react-native-vector-icons/Ionicons';
import PriceDetailView from './PriceDetailView';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import CustomActionSheet from '../../custom/CustomActionSheet';
import BackPress from '../../common/BackPress';
import RuleView from './RuleView';
import RuleView2 from './RuleView2';
import AdCodeEnum from '../../enum/AdCodeEnum';
import Key from '../../res/styles/Key';
import StorageUtil from '../../util/StorageUtil';
import NavigationUtils from '../../navigator/NavigationUtils';
import AdContentInfoView from '../common/AdContentInfoView';
import AdditionInfoView from '../common/AdditionInfoView';
import Pop from 'rn-global-modal';
import OpenGetFile from '../../service/OpenGetFile';
import HighLight from '../../custom/HighLight';
import AntDesign from 'react-native-vector-icons/AntDesign';
import OpenGetPic from '../../service/OpenGetPic';
import MerchantPriceUtil from '../../util/MerchantPriceUtil';
import Utils from '../../util/Util';
import LinearGradient from 'react-native-linear-gradient';
import CusInsurancesView from '../common/CusInsurancesView';
import {TitleView,TitleView2} from '../../custom/HighLight';
import CustomeTextInput from '../../custom/CustomTextInput';

class Flight_compCreateOrderScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            // titleView: this._headerTitleView(),
            // hide:true,
            title: "订单填写",
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
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: "white"
        }
        const { apply } = this.props;
        this.backPress = new BackPress({ backPress: () => this._backBtnClick() })//物理返回键

        this.state = {
            // 联系人
            Contact: {
                Name: '',
                Mobile: '',
                Email: ''
            },
            // 员工
            employees: [],
            //常旅客
            travellers: [],
            // 用户信息
            userInfo: {},
            // 客户配置信息
            customerInfo: {},
            // 费用归属
            ApproveOrigin: apply && apply.ApproveOrigin ? apply.ApproveOrigin : {},
            // 数据字典
            AdditionInfo: apply && apply.Addition && apply.Addition ? {
                ...apply.Addition,
                DictItemList: apply.Addition.DictItemList ? apply.Addition.DictItemList : []
            } : {
                    DictItemList: []
                },
            // 发票邮寄信息
            mailSendInfo: {

            },
            // 发票提交信息
            MaillingInfo: {

            },
            // 是否显示更多价格
            showPriceDetail: false,
            /**
             *  弹框内容
             */
            actionSheetOptions: [],
            /**
             * 公告
             */
            adList: [],
             /**
             * 服务费数据
             */
            ServiceFeesData:[],

            fileList:[],

            nullDictList:[],

            InvoiceInfo:null,
            PdfDictList:[],
            ReceiveEmail:'',

        }
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
     *  标题
     */
    _headerTitleView = () => {
        const { isSingle, goCityData, arrivalCityData } = this.params;
        if(!Util.Parse.isChinese()) return;
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center',backgroundColor:Theme.theme }}>
                <CustomText text={isSingle ? goCityData.Name : arrivalCityData.Name} style={styles.titleText} />
                <MaterialIcons name={'flight'} size={24} color={'gray'} style={{ marginHorizontal: 10 }} />
                <CustomText text={!isSingle ? goCityData.Name : arrivalCityData.Name} style={styles.titleText} />
            </View>
        )
    }

    /**
       *  获取差旅标准
       */
    _getTravelRule = () => {
        const {compReferenceEmployee} = this.props;
        this.showLoadingView();
        let modelStandar={
            OrderCategory:CommonEnum.orderIdentification.flight,
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
                           {/* {
                               response.data.RuleDesc.map((item)=>{
                                   return(
                                     <View style={{flexDirection:'row',padding:2}}>
                                        <CustomText text={item.Name+': '+item.Desc}/>
                                     </View>
                                   )
                               })
                           } */}
    
                            {  compReferenceEmployee&& compReferenceEmployee.RulesTravelDetails? 
                                compReferenceEmployee.RulesTravelDetails.map((obj)=>{
                                    if(obj.Category===1){
                                    return( 
                                        obj.Rules.map((item, index)=>{
                                            return(
                                            <View style={{flexDirection:'row',padding:2}} key={index}>
                                                <CustomText text={item.Key+': '+item.Value}/>
                                            </View>
                                            )
                                        })
                                    )  
                                    }
                                })
                               :
                               response.data.RuleDesc.map((item, index)=>{
                                return(
                                  <View style={{flexDirection:'row',padding:2}} key={index}>
                                     <CustomText text={item.Name+': '+item.Desc}/>
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
                this.showAlertView('国内机票:不限');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    componentDidMount() {
        const { employees, Contact, ApproveOrigin, travellers, AdditionInfo ,customerInfo} = this.state;
        const { apply ,compCreate_bool,comp_userInfo,comp_travelers,profileCommonEnum} = this.props;
        const { backFlightData,goFlightData } = this.params;
        this.backPress.componentDidMount();
        let flightBookingConfig = profileCommonEnum?.data?.bookingConfig?.flightBookingConfig;
        let compEmployees = [];
        let compTraveler = [];
        if(compCreate_bool ){
            compEmployees = comp_userInfo.employees;
            compTraveler = comp_userInfo.travellers;  
        }else{
            compEmployees = comp_travelers.compEmployees;
            compTraveler = comp_travelers.compTraveler;
        }
        compEmployees&&compEmployees.map((data)=>{
            const config = flightBookingConfig.find(c => {
                const currentNation = c.nation;
                const passengerNation = data.NationalCode;
                return (
                currentNation === passengerNation ||
                (!['CN','HK','MO','TW'].includes(passengerNation) && currentNation === '_') 
                ||
                (currentNation === "" && !passengerNation)
                );
            });
            let certTypes1 = config?.certTypes
            if(!(data.Certificates&&data.Certificates.length>0)){
                let certTypes = config?.certTypes?.map(item => {
                    return item
                })
                if( data.NationalCode === 'HK' ||  data.NationalCode === 'MO'){
                    certTypes = [128,512,1024];
                }else if( data.NationalCode === 'TW'){
                    certTypes = [4,512,1024];
                }
                if(!certTypes.includes(Utils.Read.certificateType2(data?.CertificateType))){
                    let obj = {
                        TypeDesc: Util.Read.typeTocertificate2(certTypes?.[0]),
                    }
                    data = this._handleLevel(data,obj)
                }
                return
            }
            const safeCertTypes = Array.isArray(certTypes1) ? certTypes1 : [];
            data.Certificates.map((itemIdCard)=>{//levelNum火车票证件展示优先级数值
                if(safeCertTypes.includes(itemIdCard.Type)){
                    if( data.NationalCode === 'HK' ||  data.NationalCode === 'MO'){
                        itemIdCard.levelNum = Utils.Read.FlightTypeCertifLevel3(itemIdCard.Type)
                    }else if( data.NationalCode === 'TW'){
                        itemIdCard.levelNum = Utils.Read.FlightTypeCertifLevel2(itemIdCard.Type)
                    }else{
                        itemIdCard.levelNum = Utils.Read.FlightTypeCertifLevel(itemIdCard.Type)
                    }
                }else{
                    itemIdCard.levelNum = 100
                }
            })
            let min = data.Certificates.reduce((prev, current) => (prev.levelNum < current.levelNum ? prev : current));//优先级数值越小，优先级越高，找到优先级最高的
            if(min.levelNum&&min.levelNum!=100){//如果优先证件等于100，说明没有符合优先级的证件，按原有展示
                data = this._handleLevel(data,min);
            }else{
                let certType = null;
                if( data.NationalCode === 'HK' ||  data.NationalCode === 'MO'){
                    certType = 128;
                }else if( data.NationalCode === 'TW'){
                    certType = 4;
                }
                let obj = {
                    TypeDesc: certType ? Util.Read.typeTocertificate2(certType) : null,
                }
                data = this._handleLevel(data,obj);
            }
        })
        compTraveler&&compTraveler.map((data)=>{
            if(!(data.Certificates&&data.Certificates.length>0)){return}
            data.Certificates.map((itemIdCard)=>{//levelNum火车票证件展示优先级数值
                if( data.NationalCode === 'HK' ||  data.NationalCode === 'MO'){
                    itemIdCard.levelNum = Utils.Read.FlightTypeCertifLevel3(itemIdCard.Type)
                }else if( data.NationalCode === 'TW'){
                    itemIdCard.levelNum = Utils.Read.FlightTypeCertifLevel2(itemIdCard.Type)
                }else{
                    itemIdCard.levelNum = Utils.Read.FlightTypeCertifLevel(itemIdCard.Type)
                }
            })
            let min = data.Certificates.reduce((prev, current) => (prev.levelNum < current.levelNum ? prev : current));//优先级数值越小，优先级越高，找到优先级最高的
            if(min.levelNum&&min.levelNum!=100){//如果优先证件等于100，说明没有符合优先级的证件，按原有展示
                data = this._handleLevel(data,min);
            }else{
                data = this._handleLevel(data,null);
            }
        })

        //出行人发票抬头都一样的时候，默认展示，其他情况自己选择
        let arr = []
        compEmployees&&compEmployees.map((item)=>{
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
            employees:compEmployees,
            travellers:compTraveler
        }) 

        this.showLoadingView();
        CommonService.getUserInfo().then(userInfoRes => {
            if (userInfoRes && userInfoRes.success && userInfoRes.data) {
                let userInfo = userInfoRes.data;
                let user = UserInfoUtil.getUser(userInfo);
                // if (apply) {
                //     UserInfoUtil.ApplyEmployee(apply, employees);
                //     UserInfoUtil.ApplyTravller(apply, travellers);
                // } else {
                //     // 添加用户
                //     employees.push(user);
                // }

                Object.assign(Contact, userInfo.OrderContact ? userInfo.OrderContact : {});
                // 布置部门
                if (!this.props.apply) {
                    Object.assign(ApproveOrigin, UserInfoUtil.ApproveOrigin(userInfo));
                }
                if (this.props.apply && !this.props.apply.ApproveOrigin) {
                    Object.assign(ApproveOrigin, UserInfoUtil.ApproveOrigin(userInfo));
                }

                let model={
                    ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                    ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
                }
                CommonService.customerInfo(model).then(response => {
                    // this.hideLoadingView();
                    if (response && response.success) {
                        let customerInfo = response.data;
                        this.state.actionSheetOptions = UserInfoUtil.DeliveryItems(customerInfo);
                        CommonService.CurrentDictList({
                            OrderCategory: 1,
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
                        this.toastMsg(response.message);
                    }

                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message);
                })
            } else {
                this.hideLoadingView();
            }
        }).catch(error => {
            this.toastMsg(error.message);
            this.hideLoadingView();
        })

        CommonService.GetAdStrategyContent(AdCodeEnum.flightOrder).then(response => {
            if (response && response.success) {
                this.setState({
                    adList: response.data
                })
            }
        }).catch(error => {

        })
        //服务费
        let model={
            OrderCategory:1,
            MatchModel:{
                IsRoundTrip:backFlightData?true:false,
                // AirlineCode:backFlightData?goFlightData.AirCode+'/'+backFlightData.AirCode:goFlightData.AirCode,
                AirlineCode:goFlightData.AirCode,
                ReturnAirlineCode:backFlightData&&backFlightData.AirCode,
            },
            MassOrderId:this.props.compMassOrderId,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        }
        CommonService.CurrentCustomerServiceFees(model).then(response => {
            if (response && response.success) {
                this.setState({
                    ServiceFeesData:response.data
                })
            }
        }).catch(error => {
            
        })
        // this._loadCurrentDicList();
    }

    _loadCurrentDicList = () => {
        const {customerInfo} = this.state;
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
        /**------------------- */
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
        //         }
        //     } else {
        //         this.toastMsg(response.message || '获取数据失败');
        //     }
        // }).catch(error => {
        //     this.hideLoadingView();
        //     this.toastMsg(error.message || '获取数据异常');
        // })
    }

    _LeftTitleBtn(){
        this.pop();
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
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
    /**
     * 综合订单下一步事件
     */
    _comp_orderBtnClick = () => {
        StorageUtil.loadKeyId(Key.FlightListStopTime).then(response => {
            if (response && (new Date().getTime() - Util.Date.toDate(response).getTime() >= 10 * 60 * 1000)) {
                this.showAlertView('终于回来了，航班可能有变化，将为您重新查询', () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                    }, '确定', () => {
                        this.dismissAlertView();
                        DeviceEventEmitter.emit(Key.FlightOrderCreateNotiList);
                        NavigationUtils.dispatchPush(this.props.navigation, 'FlightScreenIndex');
                        //   NavigationUtils.popToTop(this.props.navigation);
                    })
                })
            } else {
                this._orderBtnClick2();
            }
        }).catch(error => {
            this._orderBtnClick2();
        })
    }
  
    _orderBtnClick2 = () => {
        const { employees, travellers, customerInfo, AdditionInfo, userInfo, ApproveOrigin, Contact, mailSendInfo, MaillingInfo,ServiceFeesData, fileList, nullDictList,InvoiceInfo,PdfDictList,ReceiveEmail } = this.state;
        const { goRuleModel,goRuleModelArr, backRuleModel,backRuleModelArr, goFlightData, backFlightData} = this.params;
        const {compCreate_bool} = this.props;
        var getVisibleDictIdSet = function (dictConfigList, dictMapList, dictItemList) {
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
                if (cfg && cfg.Id !== undefined && !childIdSet.has(cfg.Id)) {
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
                    var rules = mapList && mapList.filter(function (m) { return m && m.DictId == nextId; });
                    if (!rules || rules.length === 0) {
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
        if (customerInfo.DictList) {
            const visibleCompanyIdSet = getVisibleDictIdSet(customerInfo.DictList, customerInfo.DictMapList, AdditionInfo && AdditionInfo.DictItemList);
            for (let i = 0; i < customerInfo.DictList.length; i++) {
                const obj = customerInfo.DictList[i];
                if (!visibleCompanyIdSet.has(obj.Id)) {
                    continue;
                }
                let dicItem = AdditionInfo&&AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item => 
                    // obj.NeedInput ? item.DictName === obj.Name : item.DictId === obj.Id
                    item.DictCode === obj.Code
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
        const isBuyerNameEmpty = InvoiceInfo?.BuyerName === '' || !InvoiceInfo?.BuyerName;//抬头名称是否 为空
        const hasValidSupplierType = [1, 3].includes(goFlightData?.SupplierType) || 
                            [1, 3].includes(backFlightData?.SupplierType);
        if(isBuyerNameEmpty && customerInfo?.Setting?.IsElectronicItineraryRequired && hasValidSupplierType){
            this.toastMsg('请选择发票抬头');
            return;
        }
        if(customerInfo?.Setting?.ElectronicItineraryConfig?.FlightReceiveEmailRequired && customerInfo?.Setting?.IsElectronicItinerary && hasValidSupplierType){
            if(!ReceiveEmail){
                this.toastMsg('请填写电子行程单的邮箱');
                return;
            }
        }
        function validateSingleEmail(input) {
            const emailPattern = /^\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}$/g;
            const matches = input.match(emailPattern);
            return matches && matches.length === 1;
        }
        if(ReceiveEmail&&!validateSingleEmail(ReceiveEmail)){
            this.toastMsg('填写正确邮箱，且只能填写一个邮箱');
            return;
        }
        employees.map((item)=>{
            if(!item.Mobile || !item.CertificateNumber || !(item.Gender&&item.Sex)){
               item.highLight = true;
               this.setState({})
             } 
        })
        if ((employees.length) + (travellers.length) === 0) {
            this.toastMsg('用户不能为空');
            return;
        }
        if (employees.length + travellers.length > 9) {
            this.toastMsg('最多购买人数为9人,请手动删除多余人员');
            return;
        }
      
        let TravellerList = [];
        let Travellers = [];
        let nounNum = false;
         
        for (let index = 0; index < employees.length; index++) {
                const obj = employees[index];
                obj.cusInsurances = employees[0].cusInsurances;
                obj.Certificate=obj.Certificates&&obj.Certificates[0]
                if (!obj.Mobile) {
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}手机号不能为空', obj.Name));
                    return;
                }
                
                if (!obj.CertificateNumber) {
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}证件号码不能为空', obj.Name));
                    return;
                }
                if (obj.Birthday === '0001-01-01T00:00:00' || !obj.Birthday) {
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}出生日期没有填写', obj.Name));
                    return;
                }
                
                if( !(obj.CertificateType=='身份证' || obj.CertificateType=='港澳台居民居住证') && !(obj.CertificateType=='Chinese ID Card' || obj.CertificateType=='Residence Permit for Hong Kong,Macau and Taiwan Residents')){
                    if (!obj.NationalName) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}国籍/地区不能为空', obj.Name));
                        return;
                    }
                }
                
                let addit = obj.Addition?obj.Addition:obj.AdditionInfo?obj.AdditionInfo:null
                customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.map((item)=>{
                    let dicItem =  addit&&addit.DictItemList.find(dic => dic.DictCode === item.Code);
                    if(item.IsRequire && (!dicItem.ItemName) && (item.ShowInOrder)){
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', dicItem.DictName));
                        nounNum = true;
                        return;
                    }
                })
               
                if(nounNum){
                    return;
                }
                // if (!obj.SexDesc || !obj.Sex) {
                //     obj.SexDesc = '男';
                //     obj.Sex = 1;
                // }
                obj.CertificateType = obj.CertificateType.trim()
                let TypeCer = Util.Read.certificateType2(obj.CertificateType)
                let CHName = TypeCer === 1 || (TypeCer === 32768 && obj.NationalCode==="CN")|| TypeCer === 512
                let CHName2 = (TypeCer == 2 && obj.NationalCode == "CN")
                let selcetName = obj.selcetName && Utils.Read.certificateType2(obj.CertificateType) === 128
                let UseEnglish = (CHName || CHName2) ? false : true
                if(selcetName){
                    UseEnglish = false
                }
                if(!Util.Parse.isChinese()){
                    function formatDate(date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                    obj.CertificateExpire = formatDate(new Date(obj.CertificateExpire));
                }
                let certificateModel = {
                    Type: Util.Read.certificateType2(obj.CertificateType ? obj.CertificateType : '身份证'),
                    SerialNumber: obj.CertificateNumber,
                    Expire: obj.CertificateExpire,//有效期
                    IssueNationName: obj.NationalName,//签发国
                    NationalName: obj.NationalName,//国籍
                    NationalCode: obj.NationalCode,
                    IssueNationCode: obj.NationalCode,
                    Birthday: obj.Birthday,
                    Sex: obj.Sex?obj.Sex:obj.Gender?obj.Gender:1,
                    UseEnglish:UseEnglish
                }
               
                let insuranceArr = [];
                if (obj.cusInsurances) {
                    for (let i = 0; i < obj.cusInsurances.length; i++) {
                        const cusIn = obj.cusInsurances[i];
                        if (obj.CertificateType !== '身份证' && obj.CertificateType !== 'Chinese ID Card' && cusIn.show) {
                            if (!obj.Sex && !obj.Gender) {
                                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}性别没有填写', obj.Name));
                                return;
                            }
                            if (obj.Birthday === '0001-01-01T00:00:00' || !obj.Birthday) {
                                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}出生日期没有填写', obj.Name));
                                return;
                            }
                        }
                        if (cusIn.show) {
                            insuranceArr.push({
                                Copies: '1',
                                InsuranceId: cusIn && cusIn.detail && cusIn.detail[0] && cusIn.detail[0].Id
                            })
                        }
                    }
                }
                let additionList = compCreate_bool ? obj.Addition : obj.AdditionInfo
                if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                    const visibleIdSet = getVisibleDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, additionList && additionList.DictItemList);
                    for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                       if (!visibleIdSet.has(customerInfo.EmployeeDictList[i].Id)) {
                           continue;
                       }
                       let itemIndex = additionList&&additionList.DictItemList&&additionList.DictItemList.find(item => {
                           if (!item) return false;
                           if (customerInfo.EmployeeDictList[i].Code !== undefined && item.DictCode == customerInfo.EmployeeDictList[i].Code) return true;
                           return item.DictId == customerInfo.EmployeeDictList[i].Id;
                       });
                       if(!itemIndex){
                           itemIndex = customerInfo.EmployeeDictList[i]
                           itemIndex.DictName =Util.Parse.isChinese() ? customerInfo.EmployeeDictList[i].Name : customerInfo.EmployeeDictList[i].EnName
                       }
                       if(customerInfo.EmployeeDictList[i].IsRequire &&customerInfo.EmployeeDictList[i].ShowInOrder){
                               if (itemIndex.NeedInput && !itemIndex.ItemName) {
                                   this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                                   return;
                               }
                       }
                   }
               }
                if(UseEnglish && !obj.Surname ){
                    this.toastMsg('英文姓不能为空');
                    return;
                }
                if(UseEnglish && !obj.GivenName){
                    this.toastMsg('英文名不能为空');
                    return;
                }
               if(UseEnglish&& (obj.Surname && obj.GivenName)){
                    if(Util.RegEx.isEnName(obj.Surname)){
                        this.toastMsg('英文姓必须是英文字符');
                        return;
                    }
                    if(Util.RegEx.isEnName(obj.GivenName)){
                        this.toastMsg('英文名必须是英文字符');
                        return;
                    }
                }
                if(UseEnglish&& (obj.LastName && obj.FirstName)){
                    if(Util.RegEx.isEnName(obj.LastName)){
                        this.toastMsg('英文姓必须是英文字符');
                        return;
                    }
                    if(Util.RegEx.isEnName(obj.FirstName)){
                        this.toastMsg('英文名必须是英文字符');
                        return;
                    }
                }
                TravellerList.push({
                    Sex: obj.Sex?obj.Sex:obj.Gender?obj.Gender:1,
                    Name: obj.Name,
                    Birthday: obj.Birthday,
                    Mobile: obj.Mobile,
                    Email: obj.Email,
                    Certificate: certificateModel,
                    Insurances: insuranceArr,
                    PassengerOrigin: obj.PassengerOrigin,
                    PassengerType: '1',
                    Id:obj.Id,
                    Surname: obj.LastName?obj.LastName:obj.Surname,
                    GivenName: obj.FirstName?obj.FirstName:obj.GivenName,
                    LastName:obj.LastName?obj.LastName:obj.Surname,
                    FirstName:obj.FirstName?obj.FirstName:obj.GivenName,
                    CardTravellerList:!obj.CardTravel1 && !obj.CardTravel2 ? [] :obj.TravallerCard,
                    IsVip: obj.IsVip,
                    Nationality: obj.NationalCode,
                    NationalityCode: obj.NationalityCode,
                    NationalCode: obj.NationalCode,
                    NationalName: obj.NationalName,
                    // Addition:obj.Addition?obj.Addition:obj.AdditionInfo,
                    Addition:additionList,
                })
                Travellers.push(obj);
        }
       
        for (let index = 0; index < travellers.length; index++) {
                const obj = travellers[index];
                if (!obj.Mobile) {
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}手机号不能为空', obj.Name));
                    return;
                }
                if (!obj.CertificateNumber) {
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}证件号码不能为空', obj.Name));
                    return;
                }
                if (!obj.SexDesc || !obj.Sex) {
                    obj.SexDesc = '男';
                    obj.Sex = 1;
                }
                let originModel = {
                    Type: obj.Id ? '2' : '0',
                    EmployeeId: '0',
                    TravellerId: obj.Id ? obj.Id : '0'
                }
                obj.CertificateType = obj.CertificateType.trim()
                if(!Util.Parse.isChinese()){
                    function formatDate(date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                    obj.CertificateExpire = formatDate(new Date(obj.CertificateExpire));
                }
                let certificateModel = {
                    Type: Util.Read.certificateType2(obj.CertificateType ? obj.CertificateType : '身份证'),
                    SerialNumber: obj.CertificateNumber,
                    Expire: obj.CertificateExpire,//有效期
                    IssueNationName: obj.IssueNationName,//签发国
                    NationalName: obj.NationalName,//国籍
                    NationalCode: obj.NationalCode,
                    IssueNationCode: obj.IssueNationCode,
                }
                let insuranceArr = [];
                if (obj.cusInsurances) {
                    for (let i = 0; i < obj.cusInsurances.length; i++) {
                        const cusIn = obj.cusInsurances[i];
                        if ((obj.CertificateType !== '身份证' && obj.CertificateType !== 'Chinese ID Card') && cusIn.show) {
                            if (!obj.SexDesc || obj.SexDesc === '未知') {
                                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}性别没有填写', obj.Name));
                                return;
                            }
                            if (obj.Birthday === '0001-01-01T00:00:00' || !obj.Birthday) {
                                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}出生日期没有填写', obj.Name));
                                return;
                            }
                        }
                        if (cusIn.show) {
                            insuranceArr.push({
                                Copies: '1',
                                InsuranceId: cusIn && cusIn.detail && cusIn.detail[0] && cusIn.detail[0].Id
                            })
                        }
                    }
                }

                let additionList = compCreate_bool ? obj.Addition : obj.AdditionInfo
               if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                    const visibleIdSet = getVisibleDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, additionList && additionList.DictItemList);
                    for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                        if (!visibleIdSet.has(customerInfo.EmployeeDictList[i].Id)) {
                            continue;
                        }
                        let itemIndex =  additionList&&additionList.DictItemList&&additionList.DictItemList.find(item => {
                            if (!item) return false;
                            if (customerInfo.EmployeeDictList[i].Code !== undefined && item.DictCode == customerInfo.EmployeeDictList[i].Code) return true;
                            return item.DictId == customerInfo.EmployeeDictList[i].Id;
                        });
                        if(!itemIndex){
                            itemIndex = customerInfo.EmployeeDictList[i]
                            itemIndex.DictName =Util.Parse.isChinese() ? customerInfo.EmployeeDictList[i].Name : customerInfo.EmployeeDictList[i].EnName
                        }
                        if(customerInfo.EmployeeDictList[i].IsRequire &&customerInfo.EmployeeDictList[i].ShowInOrder){
                                if (customerInfo.EmployeeDictList[i].NeedInput && !itemIndex.ItemName) {
                                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(customerInfo.EmployeeDictList[i].Name)));
                                    return;
                                }
                        }
                    }
               }
                obj.CertificateType = obj.CertificateType.trim()
                let TypeCer = Util.Read.certificateType2(obj.CertificateType)
                let CHName = TypeCer === 1 || (TypeCer === 32768 && obj.NationalCode==="CN")|| TypeCer === 512
                let CHName2 = (TypeCer == 2 && obj.NationalCode == "CN")
                let selcetName = obj.selcetName && Utils.Read.certificateType2(obj.CertificateType) === 128
                let UseEnglish = (CHName || CHName2) ? false : true
                if(selcetName){
                    UseEnglish = false
                }
                if(UseEnglish && !obj.Surname ){
                    this.toastMsg('英文姓不能为空');
                    return;
                }
                if(UseEnglish && !obj.GivenName){
                    this.toastMsg('英文名不能为空');
                    return;
                }
                if(UseEnglish && (obj.Surname && obj.GivenName)){
                    if(Util.RegEx.isEnName(obj.Surname)){
                        this.toastMsg('英文姓必须是英文字符');
                        return;
                    }
                    if(Util.RegEx.isEnName(obj.GivenName)){
                        this.toastMsg('英文名必须是英文字符');
                        return;
                    }
                }
                if(UseEnglish && (obj.LastName && obj.FirstName)){
                    if(Util.RegEx.isEnName(obj.LastName)){
                        this.toastMsg('英文姓必须是英文字符');
                        return;
                    }
                    if(Util.RegEx.isEnName(obj.FirstName)){
                        this.toastMsg('英文名必须是英文字符');
                        return;
                    }
                }
                TravellerList.push({
                    Sex: obj.Sex,
                    Name: obj.Name,
                    Birthday: obj.Birthday,
                    Nationality: obj.Nationality,
                    Mobile: obj.Mobile,
                    Email: obj.Email,
                    Certificate: certificateModel,
                    Insurances: insuranceArr,
                    PassengerOrigin: originModel,
                    PassengerType: '1',
                    Surname: obj.LastName?obj.LastName:obj.Surname,
                    GivenName: obj.FirstName?obj.FirstName:obj.GivenName,
                    Addition:additionList,
                    NationalCode: obj.NationalCode,
                    NationalName: obj.NationalName,
                })
                Travellers.push(obj);
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
        }

        const setting = customerInfo.Setting;
        if(setting&&setting.AttachmentConfig&&setting.AttachmentConfig.AirNecessary){
            if(fileList.length==0){
                this.toastMsg('未上传附件');
                return;
            }
        }       

        const { sendType } = mailSendInfo;
        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }

        const childIdSet = new Set();
        customerInfo && Array.isArray(customerInfo.DictList) && customerInfo.DictList.forEach((cfg) => {
            if (cfg && cfg.NextId) childIdSet.add(cfg.NextId);
        });
        const visibleCompanyIdSet = getVisibleDictIdSet(customerInfo && customerInfo.DictList, customerInfo && customerInfo.DictMapList, AdditionInfo && AdditionInfo.DictItemList);
        const baseCompanyDictList = customerInfo && Array.isArray(customerInfo.DictList) ? customerInfo.DictList : [];
        const nullDictList2 = baseCompanyDictList.map((item) => ({
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
        AdditionInfo.DictItemList && AdditionInfo.DictItemList.forEach(item => {
            const dictId = item && (item.DictId || item.Id);
            if (!dictId) return;
            let index = nullDictList2.findIndex(e => e && e.Id == dictId);
            if (index > -1) {
                nullDictList2[index] = Object.assign({}, nullDictList2[index], item);
            }
        })
        AdditionInfo.DictItemList = nullDictList2.filter((it) => {
            const dictId = it && (it.DictId || it.Id);
            if (!dictId) return false;
            if (!childIdSet.has(dictId)) return true;
            return visibleCompanyIdSet && visibleCompanyIdSet.has(dictId);
        })
        if(InvoiceInfo){
            InvoiceInfo.ReceiveEmail = ReceiveEmail
        }
        let requestModel = {
            appBuildVersion: global.appBuildVersion,
            Platform: Platform.OS,
            // ServiceCharge: customerInfo.ServiceCharge,
            // VipServiceCharge: customerInfo.VipServiceCharge,
            TravellerList: TravellerList,
            AdditionInfo: AdditionInfo,
            ApproveOrigin: ApproveOrigin,
            IgnoreConfirm: 0,
            Contact: Contact,
            MailingMethod: sendType ? sendType.MailingMethod : null,
            MailingInfo: MaillingInfo,
            FeeType: this.props.feeType,
            ApplyId: this.props.apply ? this.props.apply.Id : 0,
            OrderAir: this._getflightInfo(goFlightData, goRuleModel, goRuleModelArr),
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
            ElectronicItineraryInfo:InvoiceInfo            
        }
        if (this.params.backFlightData) {
            requestModel.OrderAirReturn = this._getflightInfo(backFlightData, backRuleModel, backRuleModelArr);
        }
        let AttachmentModel = {
            AttachmentItems:fileList
        }
        let params = Object.assign({ requestModel,AttachmentModel, from: 'flight', totalPrice: this._calcuPrice(0) ,Travellers}, this.params, this.state);
        if (this.props.feeType === 2) {
            this.push('FlightOrderSure', params,ServiceFeesData);
            return;
        }
        let IsNeedApproval = false;
        if (goRuleModel && goRuleModel.MatchTravelRules && goRuleModel.MatchTravelRules.unmatchlist) {
            let index = goRuleModel.MatchTravelRules.unmatchlist.find(item => item.NeedApproval);
            if (index > -1) IsNeedApproval = true;
        }
        if (backRuleModel && backRuleModel.MatchTravelRules && backRuleModel.MatchTravelRules.unmatchlist && !IsNeedApproval) {
            let index = backRuleModel.MatchTravelRules.unmatchlist.find(item => item.NeedApproval);
            if (index > -1) IsNeedApproval = true;
        }
        let approverInfo = {
            PassengerList: TravellerList,
            ApproveOrigin: ApproveOrigin,
            BusinessType: 1,
            IsNeedApproval: IsNeedApproval
        }
        // this.getTravellerUpdateCheck(TravellerList,params);
        this._toNextJudge(params);
    }
    getTravellerUpdateCheck(TravellerList,params) {
        let model = {
            OrderCategory: 1,
            Travellers: TravellerList
        }
        let Travellerarr = []
        TravellerList.forEach((item,index) => {
            let EnCertificate =I18nUtil.translate(Util.Read.typeTocertificate2(item?.Certificate?.Type));
            let EnNationality =I18nUtil.translate(item?.Certificate?.NationalName);
            let CHName = item?.Certificate?.Type === 1 || (item?.Certificate?.Type === 32768 && item?.Certificate?.NationalCode==="CN")|| item?.Certificate?.Type === 512
            let CHName2 = (item?.Certificate?.Type == 2 && item?.Certificate?.NationalCode == "CN")
            let bigName = (CHName || CHName2) ? item?.Name : item?.GivenName+'/'+item?.Surname
            Travellerarr.push(
                Util.Parse.isChinese()?
                "第"+(index+1)+'位'+'：'+bigName+'\n'+'证件类型：'+Util.Read.typeTocertificate2(item?.Certificate?.Type)+'\n'+"证件号码："+Utils.Read.simpleReplace(item?.Certificate?.SerialNumber)+'\n'+'国籍/地区：'+item?.Certificate?.NationalName+"\n\n"
                :
                (index+1)+'th'+'：'+item?.GivenName+'/'+item?.Surname+'\n'+'Certificate Type：'+EnCertificate+'\n'+'Certificate Number：'+Utils.Read.simpleReplace(item?.Certificate?.SerialNumber)+'\n'+'Nationality/Area：'+EnNationality+"\n\n"
            )
        })
        this.showLoadingView();
        CommonService.MassOrderTravellerUpdateCheck(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                let massage =response.data? Util.Parse.isChinese() ? '订单提交后旅客信息会更新，请您及时通知旅客本人\n\n' : 'Passenger info will update after submission. Please notify the passenger promptly.\n\n' : '';
                let masseges = massage+Travellerarr
                this.showAlertView(masseges, () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                    }, '确定', () => {
                        this.dismissAlertView(); 
                        this._toNextJudge(params);
                    })
                })
            } else {
                this._toNextJudge(params);
            }
        }).catch(error => {
            this.hideLoadingView();
            this._toNextJudge(params);
        });
        
    }
    _toNextJudge = (params) => {
        const { customerInfo, userInfo, ServiceFeesData} = this.state;
        this.push('FlightOrderSure', params, ServiceFeesData);
    }
    // _getApprover=()=>{
    //     this.showLoadingView();
    //     CommonService.ApproveInfo(approverInfo).then(response => {
    //         this.hideLoadingView();
    //         if (response && response.success) {
    //             params.ApproveList = response.data;
    //             this._toNextJudge(params);
    //         } else {
    //             this.showAlertView((response.message || '获取审批人信息失败') + ',是否继续提交?', () => {
    //                 return ViewUtil.getAlertButton('取消', () => {
    //                     this.dismissAlertView();
    //                 }, '确定', () => {
    //                     this.dismissAlertView();
    //                     this._toNextJudge(params);
    //                 })
    //             })
    //         }

    //     }).catch(error => {
    //         this.hideLoadingView();
    //         this.toastMsg(error.message || '获取审批人信息失败');
    //     })
    // }

    /**
    * 往返程中的航班信息
    */
    _getflightInfo = (data, ruleData, RuleModelArr) => {
        var id = null;
        var reason = '';
        if (ruleData && ruleData.lowPriceReason) {
            id = ruleData.lowPriceReason.Id;
            reason = ruleData.lowPriceReason.Reason;
        } else {
            id = '0';
        }
        let beforeReason = '';
        let beforeId = '';
        if (ruleData && ruleData.beforeDayReason) {
            beforeReason = ruleData.beforeDayReason.Reason;
            beforeId = ruleData.beforeDayReason.Id;
        }
        let bindProduct = null;
        if (data.SupplierType === 3 && data.CHBindProduct) {
            bindProduct = data.CHBindProduct
        }
        RuleModelArr&&RuleModelArr.map((item)=>{
            item.CustomerReasonId = item.Id
        })

        var aline = null;
        if (data.LowestFlight) {
            data.LowestFlight = {
                //Id: 0,
                Tax: data.LowestFlight.Tax,
                Tpm: data.LowestFlight.Tpm,
                Price: data.LowestFlight.Price,
                Stop: data.fltInfo&&data.fltInfo.Stop,
                SeqNo: 0,
                Airline: data.LowestFlight.AirCode,
                BatchId: 0,
                OrderId: 0,
                AirPlace: data.LowestFlight.ServiceCabin,
                Discount: data.LowestFlight.DiscountRate,
                PubPrice: data.LowestFlight.PubPrice,
                AgencyFee: data.LowestFlight.AgencyFee,
                AirNumber: data.LowestFlight.FlightNumber,
                Departure: data.LowestFlight.DepartureCityName,
                EquipType: data.LowestFlight.AirEquipType,
                FareBasis: '',
                ProductId: data.LowestFlight.ProductId,
                PlaceState: '',
                AirlineName: data.LowestFlight.AirCodeDesc,
                Destination: data.LowestFlight.DepartureCityName,
                RefundRules: data.LowestFlight.FlightRefundInfo,
                AirPlaceName: data.LowestFlight.ResBookDesinCodeDesc,
                EnAirPlaceName: data.LowestFlight.EnResBookDesinCodeDesc,
                DiscountDesc: data.LowestFlightDiscountRateDesc,
                ReissueRules: data.LowestFlight.FlightReIssueInfo,
                ServiceCabin: data.LowestFlight.ServiceCabin,
                ServicePrice: data.LowestFlight.ServicePrice,
                ShareAirline: '',
                SupplierType: data.LowestFlight.SupplierType,
                ShareAirNumber: '',
                //DestinationTime: vm.lowPriceFlight.ArrivalTime,
                DepartureTime: data.LowestFlight.DepartureTime,
                DestinationTime: data.LowestFlight.ArrivalTime,
                ShareAirlineName: '',
                DestinationAirport: data.LowestFlight.ArrivalAirport,
                DepartureAirportName: data.LowestFlight.DepartureAirportDesc,
                DestinationAirportName: data.LowestFlight.ArrivalAirportDesc,
                DestinationAirportTerminal: data.LowestFlight.ArrivalAirPortTerminal,
                DepartureAirportTerminal: data.LowestFlight.DepartureAirPortTerminal
            }
        }
        var orderModel = {
            TPM: data.TPM,
            Stop: data.fltInfo.Stop,
            SupplierType: data.SupplierType,
            ProductId: data.ProductId,
            RcReasonLst:RuleModelArr, //去程调用是去程的违反原因，返程调用是返程的违反原因            
            RefundRules: data.FlightRefundInfo,
            ReissueRules: data.FlightReIssueInfo,
            Departure: data.DepartureCityName,
            Destination: data.ArrivalCityName,
            DepartureAirport: data.DepartureAirport,
            DestinationAirport: data.ArrivalAirport,
            AirNumber: data.FlightNumber,
            AirPlace: data.ResBookDesigCode,
            DepartureTime: data.DepartureTime,
            DestinationTime: data.ArrivalTime,
            Airline: data.AirCode,
            Price: data.Price,
            PubPrice: data.PubPrice,
            AgencyFee: data.AgencyFee,
            ServiceCabin: data.ServiceCabin,
            DiscountDesc: data.DiscountRateDesc,
            ServicePrice: data.ServicePrice,
            AccountCode: data.AccountCode,
            Tax: data.Tax,
            CnTax: data.CnTax,
            YqTax: data.YqTax,
            DepartureAirportName: data.DepartureAirportDesc,
            DestinationAirportName: data.ArrivalAirportDesc,
            AirlineName: data.AirCodeDesc,
            EquipType: data.AirEquipType,
            AirPlaceName: data.ResBookDesinCodeDesc,
            EnAirPlaceName: data.EnResBookDesinCodeDesc,
            DepartureAirportTerminal: data.DepartureAirPortTerminal,
            DestinationAirportTerminal: data.ArrivalAirPortTerminal,
            Discount: data.DiscountRate,
            ShareAirline: data.fltInfo.codeShareLine,
            ShareAirlineName: data.fltInfo.codeShareFltLineName,
            ShareAirNumber: data.fltInfo.codeShareFltNo,
            FareBasis: data.BigCompanyFareType,
            BindProductInfo: bindProduct,
            IsCompanyFarePrice: data.IsCompanyFarePrice,
            PolicyInfo: data.CHTravellerRules ? data.CHTravellerRules : '',
            CabinTag: data.CabinTag,
            CabinTagDesc: data.CabinTagDesc,
            DataId: data.DataId,
            PriceId: data.PriceId,
            DepartureCode: data.DepartureCityCode,
            DestinationCode: data.ArrivalCityCode,
            FlightId: data.FlightId,
            SupplierFlightId: data.SupplierFlightId,
            SupplierPriceId: data.SupplierPriceId,
            PolicySummary: data.PolicySummary,
            ChannelTag: data.ChannelTag,
            IssueTag: data.IssueTag,
            IssueDesc: data.IssueDesc,
            ProductCabins:data.ProductCabins,
            FareBasisCode:data.FareBasisCode,
        }

        return orderModel;
    }
    /**
     *  弹出选择框
     */
    _actionAlertClick = () => {
        this.actionSheet.show();
    }
    /**
     *  选择配送方式
     */
    _handlePress = (index) => {
        const { MaillingInfo, mailSendInfo } = this.state;
        const { InvoiceRequestSetting } = this.state.customerInfo.Setting;
        let value = this.state.actionSheetOptions[index];
        if (InvoiceRequestSetting && InvoiceRequestSetting.DeliveryItems) {
            let find = InvoiceRequestSetting.DeliveryItems.find(item => value === item.DisplayName + '(' + item.Remark + ')');
            if (find) {
                mailSendInfo.sendType = find;
                MaillingInfo.DisplayName = find.DisplayName;
                MaillingInfo.DisplayRemark = find.Remark;
            }
            this.setState({});
        }
    }

    /**
     *  计算价格
     */
    _calcuPrice = (index) => {
        const { employees, travellers, customerInfo, mailSendInfo,ServiceFeesData } = this.state;
        const { goFlightData, backFlightData } = this.params;
        const { feeType } = this.props;
        let insurances ;
        if(feeType==2){
            insurances = customerInfo && customerInfo.Addition && customerInfo.Addition.PersonalInsurances
        }else{
            insurances = customerInfo && customerInfo.Addition && customerInfo.Addition.CusInsurances
        }
        // let total = (goFlightData.Price + goFlightData.Tax) * (employees.length + travellers.length);
        const { Price: goPrice = 0, Tax: goTax = 0 } = goFlightData || {};
        const passengerCount = (employees?.length || 0) + (travellers?.length || 0);
        let total = (goPrice + goTax) * passengerCount;
        if (backFlightData) {
            // total += (backFlightData.Price + backFlightData.Tax) * (employees.length + travellers.length)
            const passengerCount = (employees?.length ?? 0) + (travellers?.length ?? 0);
            const backPrice = (backFlightData?.Price ?? 0) + (backFlightData?.Tax ?? 0);
            total += backPrice * passengerCount;
        }
        const beforTotal = total //记录不包含服务费的总价

        const baseAmount = (goFlightData?.Price ?? 0) + (goFlightData?.Tax ?? 0);
        let back = 1 //单程1 符合条件的往返2
        if (backFlightData && ServiceFeesData.TollType==3) {
            back = 2
        }
        var serviceFee = 0;
        var VipServiceFee = 0;
        if(ServiceFeesData&&ServiceFeesData.ServiceFees && ServiceFeesData.ServiceFees.length>0){
            ServiceFeesData.ServiceFees.map((item,index)=>{
                if (item.FeeValueType == 1) {
                    if (backFlightData && ServiceFeesData.TollType==3) {
                        serviceFee += Number(item.Price * item.CountOfShowDetail);
                    }else{
                        serviceFee += Number(item.Price)
                    }
                }
                else if (item.FeeValueType == 2) {
                   let baseAmount1 = baseAmount
                   if(backFlightData){
                    //    baseAmount1 = baseAmount+(backFlightData.Price+ backFlightData.Tax)
                    baseAmount1 = baseAmount+(backFlightData?.Price ?? 0)+(backFlightData?.Tax ?? 0)
                   } 
                    item.Price = Number((item.FeeValue * baseAmount1).toFixed(2));
                    serviceFee += item.Price;
                }
            })
        } 
        if(ServiceFeesData&&ServiceFeesData.VipServiceFees && ServiceFeesData.VipServiceFees.length>0){
            ServiceFeesData.VipServiceFees.map((item,index)=>{
                if (item.FeeValueType == 1) {
                    if (backFlightData && ServiceFeesData.TollType==3) {
                        VipServiceFee += Number(item.Price * item.CountOfShowDetail);
                    }else{
                        VipServiceFee += Number(item.Price)
                    }
                }
                else if (item.FeeValueType == 2) {
                    let baseAmount2 = baseAmount
                    if(backFlightData){
                        // baseAmount2 = baseAmount+(backFlightData.Price+ backFlightData.Tax)
                        baseAmount2 = baseAmount+(backFlightData?.Price ?? 0)+(backFlightData?.Tax ?? 0)
                    } 
                    item.Price = Number((item.FeeValue * baseAmount2).toFixed(2));//
                    VipServiceFee += item.Price;
                }
            })  
        }
        
        employees.forEach(item => {
            let singlePrice = 0;
            //保险
            if (item.cusInsurances) {
                item.cusInsurances.forEach(obj => {
                    if (obj.show && obj.detail) {
                        singlePrice += obj.detail && obj.detail[0].SalePrice*obj.Count;
                    }
                })
            } else {
                if (insurances) {
                    insurances.forEach(insu => {
                        if ((insu.ShowMode === 1 || insu.ShowMode === 2) && insu.detail) {
                            // singlePrice += insu.PerPrice*insu.Count;
                            singlePrice += insu.detail && insu.detail[0].SalePrice*insu.Count;
                        }
                    })
                }
            }
            if (backFlightData) {
                singlePrice *= 2;
            }
            //服务费
            if (ServiceFeesData&&ServiceFeesData.IsShowServiceFee || feeType===2) {
                if (item.IsVip) {
                    singlePrice += VipServiceFee;
                } else {
                    singlePrice += serviceFee;
                }
            }
            total += singlePrice;
        })
        travellers.forEach(item => {
            let singlePrice = 0;
            if (item.cusInsurances) {
                item.cusInsurances.forEach(obj => {
                    if (obj.show && obj.detail) {
                        singlePrice += obj.detail && obj.detail[0].SalePrice*obj.Count;
                    }
                })
            } else {
                if (insurances) {
                    insurances.forEach(insu => {
                        if ((insu.ShowMode === 1 || insu.ShowMode === 2) && insu.detail) {
                            singlePrice += insu.detail && insu.detail[0].SalePrice*insu.Count;
                        }
                    })
                }
            }
            if (backFlightData) {
                singlePrice *= 2;
            }
            if (ServiceFeesData&&ServiceFeesData.IsShowServiceFee || feeType===2) {
                if (item.IsVip) {
                    singlePrice += VipServiceFee;
                } else {
                    singlePrice += serviceFee;
                }
            }
            total += singlePrice ;
        })
        if (goFlightData.SupplierType === 3 && goFlightData.CHBindProduct) {
            goFlightData.CHBindProduct.forEach(item => {
                total += item.subProdPrice + (employees.length + travellers.length);
            })
        }
        if (backFlightData && backFlightData.SupplierType === 3 && backFlightData.CHBindProduct) {
            backFlightData.CHBindProduct.forEach(item => {
                total += item.subProdPrice + (employees.length + travellers.length);
           })
        }

        if (mailSendInfo.sendType && mailSendInfo.sendType.MailingMethod !== 1) {
            total += (customerInfo && customerInfo.Setting) ? customerInfo.Setting.ExpressPrice : 0;
        }

        let servicePrice = total - beforTotal //用包含服务费的总价 减去 不包含服务费的总价
        let merchantPrice = ServiceFeesData && ServiceFeesData.IsShowServiceFee || feeType === 2
                            ?
                            MerchantPriceUtil.merchantPrice( CommonEnum.orderIdentification.flight, customerInfo, beforTotal, servicePrice,)
                            :0 
        let totalPrice = (total + merchantPrice).toFixed(2)
        if(index){
            return merchantPrice//刷卡手续费
        }else{
            return totalPrice=='NaN' ? '--' : totalPrice
        }
    }

    _handleLevel = (data,obj) => {
        data.CertificateNumber = obj&&obj.SerialNumber;
        data.Expire = obj&&obj.Expire;
        data.CertificateExpire = obj&&obj.Expire;
        data.IssueNationName = obj&&obj.IssueNationName;
        data.IssueNationCode = obj&&obj.IssueNationCode;
        data.CertificateType = obj&&obj.TypeDesc;
        data.CertificateId = obj&&obj.Type
        return data
    }
    
    _changeComprehensiveUI = () =>{
        const { goFlightData, backFlightData} = this.params;
        const {  customerInfo, userInfo, travellers, employees } = this.state;
        return(
            <View style={{backgroundColor:'#fff',borderRadius:6,marginHorizontal:10,padding:10}}>
             <ComprehPassnegerView
                        userInfo={userInfo}
                        travellers={travellers}
                        employees={employees}
                        customerInfo={customerInfo}
                        from={'flight'}
                        otwThis={this}
                        goFlightData={goFlightData}
                        backFlightData={backFlightData}
                    />
            </View>
        )
    }

    renderBody() {
        const { goFlightData, backFlightData, goRuleModel, backRuleModel,isSingle, goCityData, arrivalCityData,moreTravel } = this.params;
        const { Contact, ApproveOrigin, customerInfo, userInfo, AdditionInfo, mailSendInfo, travellers, employees, actionSheetOptions, MaillingInfo,fileList,InvoiceInfo,PdfDictList,ReceiveEmail } = this.state;
        const { feeType ,comp_userInfo,compSwitch} = this.props;
        const hasValidSupplierType = [1, 3].includes(goFlightData?.SupplierType) || 
                            [1, 3].includes(backFlightData?.SupplierType);
        return (
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                <AdContentInfoView adList={this.state.adList} detail_ad={true}/>
                <KeyboardAwareScrollView keyboardShouldPersistTaps={'always'} style={{ flex: 1,marginTop:10 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerView}>
                        <HeaderView
                            headerTextTile={isSingle?'单程':moreTravel?'第一程':'去'}
                            model={goFlightData}
                            ruleModel={goRuleModel}
                            otwThis={this}
                            feeType={feeType}
                        />
                        <HeaderView
                            headerTextTile={moreTravel?'第二程':'返'}
                            model={backFlightData}
                            otwThis={this}
                            ruleModel={backRuleModel}
                            feeType={feeType}
                        />
                    </View>
                    {customerInfo?.Setting?.IsElectronicItinerary && hasValidSupplierType ? 
                        <View style={{ backgroundColor: 'white',marginHorizontal:10,borderRadius:6, paddingBottom:10,marginBottom:10}}>
                            <View style={{ backgroundColor: 'white',borderRadius:6}}>
                                <View style={{flexDirection:'row',padding:10,backgroundColor: Theme.yellowBg,borderTopLeftRadius:6,borderTopRightRadius:6}}>
                                    <CustomText style={{paddingLeft:10, color:Theme.theme}} text={'电子行程单（如发票信息开错，请联系您的差旅顾问）'} />
                                </View>
                                <TouchableHighlight underlayColor='transparent' onPress={()=>{this._getInvoice()}}>
                                    <View style={styles.section}>
                                        { 
                                          customerInfo && customerInfo.Setting.IsElectronicItineraryRequired ?
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
                                            {/* <CustomText style={{}} text={Util.Parse.isChinese()?'发票抬头名称：':''} /> */}
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
                                customerInfo?.Setting?.ElectronicItineraryConfig?.FlichtNoShowReceiveEmail ? null :
                                <View style={{flexDirection:'row',paddingLeft:20,alignItems:'center'}}>
                                    { 
                                        customerInfo && customerInfo.Setting.ElectronicItineraryConfig.FlightReceiveEmailRequired ?
                                        <HighLight style={{}} name={'收件邮箱:'} /> :
                                        <CustomText style={{}} text={'收件邮箱:'} />
                                    }
                                    <CustomeTextInput style={{height:38}} placeholder='请输入邮箱' value={ReceiveEmail} onChangeText={(text) => { this.setState({ReceiveEmail:text}) }} />
                                </View>
                            }
                        </View>:null
                    }

                    {this._changeComprehensiveUI()}
                    {
                        (!employees || employees.length==0)?null:
                        (employees[0].cusInsurances&& <CusInsurancesView  cusiItem={employees[0].cusInsurances} otwThis={this}/>) 
                    }
                    
                    <AdditionInfoView
                            customerInfo={customerInfo}
                            userInfo={userInfo}
                            AdditionIfo={AdditionInfo}
                            ApproveOrigin={ApproveOrigin}
                            fromNo = {2}//国内飞机 BusinessCategory
                            PdfDictList={fileList&&fileList.length>0 ? PdfDictList :null}
                    />
                    {
                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.AirContainsAttachment//判断上传附件是否展示
                        ?
                        <View style={{margin:10,backgroundColor:'#fff',paddingHorizontal:20,borderRadius:6,paddingVertical:10}}>
                            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between', backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,flexWrap:'wrap'}}>
                                    {
                                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.AirNecessary?
                                        <View style={{flexDirection:'row'}}>
                                        <TitleView2 required={true} title={'上传附件'}  style={{}}></TitleView2>
                                        </View>
                                        :
                                        <View style={{flexDirection:'row'}}>
                                        <TitleView2  title={'上传附件'}  style={{paddingVertical:10}}></TitleView2>
                                        </View>
                                    }
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between" }}>
                                        <TouchableOpacity style={[{ borderColor: Theme.theme }, styles.borderAll]} 
                                            onPress={()=>{
                                                this._selectFile()
                                            }}
                                        >
                                            <CustomText text='从文件夹上传' style={{color: Theme.theme }} />
                                        </TouchableOpacity>
                                        {
                                          Platform.OS === 'android'?null:
                                            <TouchableOpacity style={[{ borderColor: Theme.theme ,marginLeft:5 }, styles.borderAll]} 
                                                onPress={()=>{
                                                this._selectImage()
                                                }}
                                            >
                                                <CustomText text='打开相册或相机' style={{color: Theme.theme }} />
                                            </TouchableOpacity>}
                                    </View>
                            </View>
                            <View style={{ backgroundColor: 'white',justifyContent:'space-between',marginTop:10}}>
                                    <CustomText text={'单个文件最大5MB，数量最多5个，格式为:'} style={{fontSize:11, color:'red'}} ></CustomText>
                                    <CustomText text={'jpg,png,jpeg,bmp,gif,xlsx,xls,txt,doc,docx,md,pdf,ppt,pptx,wps;'} style={{fontSize:11, color:'red'}}></CustomText>                                  
                            </View>
                        </View>
                        :null
                    }
                    {
                       fileList.map((item,index)=>{
                            return(
                                <View style={{ flexDirection: 'row', height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:4}}>
                                    <CustomText text={item.FileName}></CustomText>                 
                                    <AntDesign name={'delete'} onPress={()=>{
                                        fileList.splice(index,1);
                                        this.setState({})
                                    }} size={26} color={Theme.theme} />
                                </View>  
                            )
                        })
                    }
                   
                </KeyboardAwareScrollView>
                {
                    this._compRenderBottomView() //综合订单明细 
                }
                <PriceDetailView ref={o => this.priceDetailView = o} {...this.state} {...this.params} {...compSwitch} merchantPrice={this._calcuPrice(1)} {...comp_userInfo}
                     callBack={()=>{
                        this._showPriceDetail();
                     }}
                />
                <CustomActionSheet ref={o => this.actionSheet = o} options={actionSheetOptions} onPress={this._handlePress} />
                <RuleView ref={o => this.ruleView = o} />
                <RuleView2 ref={o => this.ruleView2 = o} />
            </LinearGradient>
        )
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
    
    _compRenderBottomView = () => {
        const { customerInfo, showPriceDetail,ServiceFeesData } = this.state;
        let isShowServiceCharge =   ServiceFeesData && ServiceFeesData.IsShowServiceFee;
        return (
            <View style={{ height: 50, flexDirection: 'row', backgroundColor: 'white', alignItems: 'center', borderTopWidth:1, borderColor:Theme.normalBg }}>
                <CustomText style={{ marginLeft: 10, color:Theme.theme , fontSize: 16,fontWeight:'bold',marginTop:3 }} text={'¥' } />
                <CustomText style={{ color:Theme.theme , fontSize: 20 }} text={ this._calcuPrice(0)} />
                {
                    isShowServiceCharge ?
                        <CustomText style={{ color: 'gray', fontSize: 12 }} text='(含服务费)' />
                        : null
                }
                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._showPriceDetail}>
                        <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end", alignItems: "center", height: 50 }}>
                            <CustomText style={{ fontSize: 12, color: 'gray' }} text='明细' />
                            <Ionicons name={showPriceDetail ? 'chevron-up' : 'chevron-down'} size={16} color={'gray'} style={{ marginLeft: 2 }} />
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor='transparent' onPress={this._comp_orderBtnClick}>
                        <View style={styles.bottom_btn}>
                            <CustomText style={{ color: 'white',fontSize:16 }} text='下一步' />
                        </View>
                    </TouchableHighlight>
                </View>
            </View >
        )
    }

    _selectFile=()=>{
        const {fileList,customerInfo,AdditionInfo} = this.state;
        if(fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        OpenGetFile.getFile(this).then(response => {
            if (!response) {
                return;
            }
            fileList.push(response);
            this.setState({
                fileList:fileList
            },()=>{
                if(customerInfo.Setting.IsPdfAnalyze){
                    let model={
                        PdfUrl:response.Url,
                        orderCategory:CommonEnum.CategogryId.flight,
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
            <View style={{ marginTop: 10, backgroundColor: 'white', paddingHorizontal: 10, height: 44, flexDirection: 'row', alignItems: 'center' }}>
                <CustomText text='支付方式' style={{ flex: 3 }} />
                <CustomText text={customerInfo.Setting.IsPaymentOnline ? '在线支付' : customerInfo.SettleTypeDesc} style={{ flex: 7 }} />
            </View>
        )
    }
}
const getStatePorps = state => ({
    feeType: state.feeType.feeType,
    apply: state.apply.apply,
    comp_userInfo:state.comp_userInfo,
    compSwitch:state.compSwitch.bool,
    compMassOrderId: state.compMassOrderId.massOrderId,
    comp_travelers: state.comp_travelers,
    compCreate_bool: state.compCreate_bool.bool,
    compReferenceEmployee: state.compReferenceEmployee.ReferenceEmployee,//综合订单出差人选定参考出差人信息
    profileCommonEnum: state.profileCommonEnum,   
})
export default connect(getStatePorps)(Flight_compCreateOrderScreen);


const styles = StyleSheet.create({
    titleText: {
        fontSize: 18,
        color: 'gray'
    },
    headerView: {
        marginHorizontal: 10,
        marginBottom:10,
    },
    bottom_btn: {
        width: 120,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.theme,
        borderRadius:2,
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
