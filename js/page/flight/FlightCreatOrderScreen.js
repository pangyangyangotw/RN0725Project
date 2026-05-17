import React from 'react';
import {
    View,
    Platform,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    DeviceEventEmitter,
    Keyboard,
    Image,
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
import ContactView from '../common/ContactView';
import UserInfoUtil from '../../util/UserInfoUtil';
import { connect } from 'react-redux';
import AdditionInfoView from '../common/AdditionInfoView';
import PassnegerView from '../common/PassnegerView';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PriceDetailView from './PriceDetailView';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import Customer from '../../res/styles/Customer';
import CustomActionSheet from '../../custom/CustomActionSheet';
import BackPress from '../../common/BackPress';
import RuleView from './RuleView';
import RuleView2 from './RuleView2';
import AdCodeEnum from '../../enum/AdCodeEnum';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Key from '../../res/styles/Key';
import StorageUtil from '../../util/StorageUtil';
import NavigationUtils from '../../navigator/NavigationUtils';
import AdContentInfoView from '../common/AdContentInfoView';
import Pop from 'rn-global-modal'
import { ScrollView } from 'react-native-gesture-handler';
import HighLight from '../../custom/HighLight';
import OpenGetFile from '../../service/OpenGetFile';
import OpenGetPic from '../../service/OpenGetPic';
import MerchantPriceUtil from '../../util/MerchantPriceUtil';
import Utils from '../../util/Util';
import  LinearGradient from 'react-native-linear-gradient';
import CusInsurancesView from '../common/CusInsurancesView';
import {HighLight2,TitleView2} from '../../custom/HighLight';
import CustomeTextInput from '../../custom/CustomTextInput';


class FlightCreateOrderScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            // titleView: this._headerTitleView(),
            // rightButton: props.feeType === 1 ? ViewUtil.getRightButton('差旅标准', this._getTravelRule) : null
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
            ReceiveEmail:'',  
        }
       
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: "white"
        }
        const { apply,comp_userInfo } = this.props;
        if(comp_userInfo&&comp_userInfo.ProjectItem && apply&&apply.ApproveOrigin){//如果订单和出差单都选择项目审批 使用出差单的项目审批规则
            if(comp_userInfo.ProjectItem.OriginType==apply.ApproveOrigin.OriginType==1){
                comp_userInfo.ProjectItem = apply.ApproveOrigin
            }
        }
        this.backPress = new BackPress({ backPress: () => this._backBtnClick() })
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

            InvoiceInfo:null,  //发票抬头        
            
            PdfDictList:[],
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
        if(this.state.showPriceDetail){
            this.setState({
                showPriceDetail: false
            }, () => {
                this.priceDetailView && this.priceDetailView.hide();
            })
            return true;
        }
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CustomText text={isSingle ? goCityData.Name : arrivalCityData&&arrivalCityData.Name} style={styles.titleText} />
                <MaterialIcons name={'flight'} size={24} color={Theme.darkColor} style={{ marginHorizontal: 10 }} />
                <CustomText text={!isSingle ? goCityData.Name : arrivalCityData&&arrivalCityData.Name} style={styles.titleText} />
            </View>
        )
    }

    /**
     *  获取差旅标准
     */
    _getTravelRule = () => {
        let modelStandar={
            OrderCategory:CommonEnum.orderIdentification.flight,
        }
        this.showLoadingView();
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
        const { employees, Contact, ApproveOrigin, travellers,userInfo,AdditionInfo } = this.state;
        const { goFlightData,backFlightData } = this.params;
        const { apply, comp_userInfo, profileCommonEnum} = this.props;
        this.backPress.componentDidMount();
        let flightBookingConfig = profileCommonEnum?.data?.bookingConfig?.flightBookingConfig;
        comp_userInfo.employees&&comp_userInfo.employees.map((data)=>{
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
                    TypeDesc:certType ? Util.Read.typeTocertificate2(certType) : null,
                }
                data = this._handleLevel(data,obj);
            }
        })
        comp_userInfo.travellers&&comp_userInfo.travellers.map((data)=>{
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
                // if (!this.props.apply) {
                //     Object.assign(ApproveOrigin, UserInfoUtil.ApproveOrigin(userInfo));
                // }
                // if (this.props.apply && !this.props.apply.ApproveOrigin) {
                //     Object.assign(ApproveOrigin, UserInfoUtil.ApproveOrigin(userInfo));
                // }
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

        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }
        //服务费
        let model={
            OrderCategory:1,
            MatchModel:{
                IsRoundTrip:backFlightData?true:false,
                AirlineCode:goFlightData.AirCode,
                ReturnAirlineCode:backFlightData&&backFlightData.AirCode,
            },
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
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
        const {AdditionInfo, customerInfo} = this.state;
        let arr = customerInfo&&customerInfo.DictList&&customerInfo.DictList.filter(obj => {
            return obj.ShowInOrder
        })
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
            ShowInOrder:true,
        }))
        this.setState({
            nullDictList: nullDictList,
        })
        // this.showLoadingView();
        // let model = {
        //     OrderCategory: 0,
        //     ShowInApply: true,
        //     ShowInDemand: false,
        //     ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
        //     ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        // }
        // CommonService.CurrentDictList(model).then(response => {
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

    _showPriceDetail = () => {
        Keyboard.dismiss();
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
    _orderBtnClick = () => {
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
        const { employees, travellers, customerInfo, AdditionInfo, userInfo, ApproveOrigin, Contact, mailSendInfo, MaillingInfo,ServiceFeesData,fileList,nullDictList, InvoiceInfo,ReceiveEmail } = this.state;
        const { goFlightData, goRuleModel,goRuleModelArr, backFlightData, backRuleModel,backRuleModelArr } = this.params;
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
            diffArr&&diffArr.map((diffitem)=>{
                if(item.Id == diffitem){
                    diffDicList.push(item)
                }
            })
        })
        var subSet = function (arr1, arr2) {//标准项和相同项的差集  3
            var subset = [];
            var IdArr = []
            arr2.map((_item)=>{
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
        const hasValidSupplierType = [1, 3].includes(goFlightData?.SupplierType) || 
                            [1, 3].includes(backFlightData?.SupplierType);
        const isBuyerNameEmpty = InvoiceInfo?.BuyerName === '' || !InvoiceInfo?.BuyerName;//抬头名称是否 为空
        if(this.props.feeType==1 && isBuyerNameEmpty && customerInfo?.Setting?.IsElectronicItineraryRequired && hasValidSupplierType){
            this.toastMsg('请选择发票抬头');
            return;
        }
        if (employees.length + travellers.length === 0) {
            this.toastMsg('用户不能为空');
            return;
        }
        if (employees.length + travellers.length > 9) {
            this.toastMsg('最多购买人数为9人,请手动删除多余人员');
            return;
        }
        function validateSingleEmail(input) {
            const emailPattern = /^\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}$/g;
            const matches = input.match(emailPattern);
            return matches && matches.length === 1;
        }
        if(customerInfo?.Setting?.ElectronicItineraryConfig?.FlightReceiveEmailRequired && customerInfo?.Setting?.IsElectronicItinerary && hasValidSupplierType){
            if(!ReceiveEmail){
                this.toastMsg('请填写电子行程单的邮箱');
                return;
            }
        }
        if(ReceiveEmail&&!validateSingleEmail(ReceiveEmail)){
            this.toastMsg('填写正确邮箱，且只能填写一个邮箱');
            return;
        }
        let TravellerList = [];
        for (let index = 0; index < employees.length; index++) {
            const obj = employees[index];
            obj.cusInsurances = employees[0].cusInsurances;
            obj.NationalName = obj.NationalName?obj.NationalName:obj.Nationality?obj.Nationality:null
            if (!obj.Mobile) {
                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}手机号不能为空', obj.Name));
                return;
            }
            if( !(obj.CertificateType=='身份证' || obj.CertificateType=='港澳台居民居住证') && !(obj.CertificateType=='Chinese ID Card' || obj.CertificateType=='Residence Permit for Hong Kong,Macau and Taiwan Residents')){
                if (!obj.NationalName) {
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}国籍/地区不能为空', obj.Name));
                    return;
                }
            }
            if (!obj.CertificateNumber) {
                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}证件号码不能为空', obj.Name));
                return;
            }
            if (obj.CertificateId !=1 && (obj.Birthday === '0001-01-01T00:00:00' || !obj.Birthday)) {
                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}出生日期没有填写', obj.Name));
                return;
            }         
            if (!obj.SexDesc || !obj.Sex) {
                obj.SexDesc = '男';
                obj.Sex = 1;
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
                Sex: obj.Sex,
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
                        if (obj.CertificateId !=1 && (obj.Birthday === '0001-01-01T00:00:00' || !obj.Birthday)) {
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
            if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                 for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                    let itemIndex =  obj.Addition&&obj.Addition.DictItemList&&obj.Addition.DictItemList.find(
                        item => item.DictCode === customerInfo.EmployeeDictList[i].Code
                    );
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
            if(UseEnglish && (obj.Surname || obj.GivenName)){
                if(Util.RegEx.isEnName(obj.Surname)){
                    this.toastMsg('英文姓必须是英文字符');
                    return;
                }
                if(Util.RegEx.isEnName(obj.GivenName)){
                    this.toastMsg('英文名必须是英文字符');
                    return;
                }
            }
            TravellerList.push({
                Sex: obj.Sex,
                Name: obj.Name,
                Birthday: obj.Birthday,
                // Nationality: obj.Nationality,
                Mobile: obj.Mobile,
                Email: obj.Email,
                Certificate: certificateModel,
                Insurances: insuranceArr,
                PassengerType: '1',
                Id:obj.Id,
                Surname: obj.Surname,
                GivenName: obj.GivenName,
                LastName: obj.Surname,
                FirstName: obj.GivenName,
                Addition:obj.Addition?obj.Addition:obj.AdditionInfo?obj.AdditionInfo:null,
                CardTravellerList:!obj.CardTravel1 && !obj.CardTravel2 ? [] :obj.TravallerCard,
                IsVip: obj.IsVip,
                Nationality:obj.NationalCode?obj.NationalCode:obj.NationalityCode?obj.NationalityCode:null,
                // NationalityCode:obj.NationalCode?obj.NationalCode:obj.NationalityCode?obj.NationalityCode:null,
                PassengerOrigin: obj.PassengerOrigin,
            })
        }
        for (let index = 0; index < travellers.length; index++) {
            const obj = travellers[index];
            if (!obj.Mobile) {
                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}手机号不能为空', obj.Name));
                return;
            }
            if(!obj.Email && customerInfo.EmailRequired){
                this.toastMsg(I18nUtil.tranlateInsert('{{noun}} Email不能为空', obj.Name));
                return;
            }
            // if (obj.Birthday === '0001-01-01T00:00:00' || !obj.Birthday) {
            //     this.toastMsg(I18nUtil.tranlateInsert('{{noun}}出生日期没有填写', obj.Name));
            //     return;
            // }
            if (!obj.CertificateNumber) {
                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}证件号码不能为空', obj.Name));
                return;
            }
            if (!obj.SexDesc && !obj.Sex && !obj.Gender) {
                this.toastMsg(I18nUtil.tranlateInsert('{{noun}}性别不能为空', obj.Name));
                return;
            }
            if (!obj.SexDesc && !obj.Sex) {
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
                IssueNationName: obj.NationalName,//签发国
                NationalName: obj.NationalName,//国籍
                NationalCode: obj.NationalCode,
                IssueNationCode: obj.NationalCode,
                Birthday: obj.Birthday,
                Sex: obj.Sex
            }
            let insuranceArr = [];
            if (obj.cusInsurances) {
                for (let i = 0; i < obj.cusInsurances.length; i++) {
                    const cusIn = obj.cusInsurances[i];
                    if (obj.CertificateType !== '身份证' && obj.CertificateType !== 'Chinese ID Card' && cusIn.show) {
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
            if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                    let itemIndex = obj.Addition&&obj.Addition.DictItemList&&obj.Addition.DictItemList.find(
                        item => item.DictId === customerInfo.EmployeeDictList[i].Id
                    );
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
            let UseEnglish = (CHName || CHName2) ? false : true
            let selcetName = obj.selcetName && Utils.Read.certificateType2(obj.CertificateType) === 128
            if(selcetName){
                UseEnglish = false
            }
            if(UseEnglish && !obj.Surname ){
                this.toastMsg('英文姓不能为空');
                return;
            }
            if(UseEnglish&& !obj.GivenName){
                this.toastMsg('英文名不能为空');
                return;
            }
            if(UseEnglish &&(obj.Surname || obj.GivenName)){
                if(Util.RegEx.isEnName(obj.Surname)){
                    this.toastMsg('英文姓必须是英文字符');
                    return;
                }
                if(Util.RegEx.isEnName(obj.GivenName)){
                    this.toastMsg('英文名必须是英文字符');
                    return;
                }
            }
            TravellerList.push({
                Sex: obj.Sex,
                Name: obj.Name,
                Birthday: obj.Birthday,
                // Nationality: obj.Nationality,
                Id:obj.Id,
                Nationality:obj.NationalCode?obj.NationalCode:obj.NationalityCode?obj.NationalityCode:null,
                // NationalityCode:obj.NationalCode?obj.NationalCode:obj.NationalityCode?obj.NationalityCode:null,
                Mobile: obj.Mobile,
                Email: obj.Email,
                Certificate: certificateModel,
                Insurances: insuranceArr,
                PassengerOrigin: originModel,
                PassengerType: '1',
                Surname: obj.Surname,
                GivenName: obj.GivenName,
                LastName: obj.Surname,
                FirstName: obj.GivenName,
                Addition:obj.Addition?obj.Addition:obj.AdditionInfo?obj.AdditionInfo:null,
                AdditionInfo:obj.Addition?obj.Addition:obj.AdditionInfo?obj.AdditionInfo:null,
                IsVip:obj.IsVip,
            })
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
            if (diffArr) {
                for (let i = 0; i < diffArr.length; i++) {
                    const obj = diffArr[i];
                    if (obj.IsRequire && obj.ShowInOrder) {
                        if (userInfo && userInfo.Customer.Id === Customer.DRHJ && obj.Name === '实施阶段') {
                            continue;
                        }
                        let dicItem = AdditionInfo&&AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(dic => dic.DictId === obj.Id);
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
                }
            }
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
        const setting = customerInfo.Setting;
        if (setting && (setting.IsPaymentOnline || this.props.feeType == 2) && setting.InvoiceRequestType == 2) {
            if (!mailSendInfo.sendType) {
                this.toastMsg('请选择配送方式');
                return;
            }
            if (!mailSendInfo.mailInfo) {
                this.toastMsg('请选择发票抬头');
                return;
            }
            if (mailSendInfo.sendType.MailingMethod != 1 && !mailSendInfo.addressInfo) {
                this.toastMsg('请选择配送信息');
                return;
            }
            MaillingInfo.PostFee = mailSendInfo.sendType.MailingMethod !== 1 ? setting.ExpressPrice : 0;
        }
        if(setting&&setting.AttachmentConfig&&setting.AttachmentConfig.AirNecessary){
            if(fileList.length==0){
                this.toastMsg('未上传附件');
                return;
            }
        }

        const { sendType } = mailSendInfo;
        if (diffDicList && this.props.feeType === 1) {
            for (let i = 0; i < diffDicList.length; i++) {
                const obj = diffDicList[i];
                let dicItem = AdditionInfo&&AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item => 
                    // dic.DictId === obj.Id
                    // obj.NeedInput ? item.DictName === obj.Name : item.DictId === obj.Id
                    item.DictCode === obj.Code
                );
                let regex=new RegExp(dicItem?.FormatRegexp)
                if (obj.IsRequire && obj.ShowInOrder) {
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
        
        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }
        let AttachmentModel = {
            AttachmentItems:fileList
        }

        let list = [];
        AdditionInfo&&AdditionInfo.DictItemList&&AdditionInfo.DictItemList.map((item)=>{
             if(item.BusinessCategory&2){
                list.push(item)
             }
        })

        let IsNeedApproval = false;
        if (goRuleModel && goRuleModel.MatchTravelRules && goRuleModel.MatchTravelRules.unmatchlist) {
            // let index = goRuleModel.MatchTravelRules.unmatchlist.findIndex(item => item.NeedApproval);
            // if (index > -1) IsNeedApproval = true;
            if(goRuleModel && goRuleModel.lowPriceReason){
                if(goRuleModel.MatchTravelRules.unmatchlist.find(item => item.NeedApproval && item.RuleType == 1)){
                    IsNeedApproval = true;
                }
            }
            if(goRuleModel && goRuleModel.beforeDayReason){
                if(goRuleModel.MatchTravelRules.unmatchlist.find(item => item.NeedApproval && item.RuleType == 2)){
                    IsNeedApproval = true;
                }
            }
            if(goRuleModel && goRuleModel.cabinDiscountReason&& goRuleModel.cabinDiscountReason.Reason){
                if(goRuleModel.MatchTravelRules.unmatchlist.find(item => item.NeedApproval && item.RuleType == 7)){
                    IsNeedApproval = true;
                }
            }
        }
        if (backRuleModel && backRuleModel.MatchTravelRules && backRuleModel.MatchTravelRules.unmatchlist && !IsNeedApproval) {
            // let index = backRuleModel.MatchTravelRules.unmatchlist.findIndex(item => item.NeedApproval);
            // if (index > -1) IsNeedApproval = true;
            if(backRuleModel && backRuleModel.lowPriceReason){
                if(backRuleModel.MatchTravelRules.unmatchlist.find(item => item.NeedApproval && item.RuleType == 1)){
                    IsNeedApproval = true;
                }
            }
            if(backRuleModel && backRuleModel.beforeDayReason){
                if(backRuleModel.MatchTravelRules.unmatchlist.find(item => item.NeedApproval && item.RuleType == 2)){
                    IsNeedApproval = true;
                }
            }
            if(backRuleModel && backRuleModel.cabinDiscountReason&& backRuleModel.cabinDiscountReason.Reason){
                if(backRuleModel.MatchTravelRules.unmatchlist.find(item => item.NeedApproval && item.RuleType == 7)){
                    IsNeedApproval = true;
                }
            }
        }
        
        AdditionInfo.DictItemList = list
        AdditionInfo.DictItemList&&AdditionInfo.DictItemList.forEach(item => {
            let index = nullDictList.findIndex(e => e.Id == item.Id)
            if (index > -1){
                nullDictList[index] = item
            }
        })
        AdditionInfo.DictItemList = nullDictList
        if(InvoiceInfo){
            InvoiceInfo.ReceiveEmail = ReceiveEmail
        }
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
        let requestModel = {
            appBuildVersion: global.appBuildVersion,
            Platform: Platform.OS,
            ServiceCharge: customerInfo.ServiceCharge,
            VipServiceCharge: customerInfo.VipServiceCharge,
            TravellerList: TravellerList,
            AdditionInfo: AdditionInfo,
            ApproveOrigin: ApproveOrigin,
            IgnoreConfirm: 0,
            Contact: Contact,
            MailingMethod: sendType ? sendType.MailingMethod : null,
            MailingInfo: MaillingInfo,
            FeeType: this.props.feeType,
            ApplyId: this.props.apply ? this.props.apply.Id : 0,
            JourneyId: this.params.JourneyId,
            OrderAir: this._getflightInfo(goFlightData, goRuleModel, goRuleModelArr,IsNeedApproval),
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
            Attachment:AttachmentModel,
            ElectronicItineraryInfo:InvoiceInfo
        }
        if (this.params.backFlightData) {
            requestModel.OrderAirReturn = this._getflightInfo(backFlightData, backRuleModel, backRuleModelArr,IsNeedApproval);
        }
        // let params = Object.assign({ requestModel, from: 'flight', totalPrice: this._calcuPrice(0) }, this.params, this.state);
        // if (this.props.feeType === 2) {
        //     this.push('FlightOrderSure', params,ServiceFeesData);
        //     return;
        // }
        requestModel.IsNeedApproval = IsNeedApproval
        let params = Object.assign({ requestModel, from: 'flight', totalPrice: this._calcuPrice(0) }, this.params, this.state);
        if (this.props.feeType === 2) {
            this.push('FlightOrderSure', params,ServiceFeesData);
            return;
        }
        // this.getTravellerUpdateCheck(TravellerList,ApproveOrigin,IsNeedApproval,params);
        this._getApproveInfo(TravellerList,ApproveOrigin,IsNeedApproval,params);
    }

    getTravellerUpdateCheck(TravellerList,ApproveOrigin,IsNeedApproval,params) {
        let model = {
            OrderCategory: 1,
            Travellers: TravellerList
        }
        let Travellerarr = []
        TravellerList?.forEach((item,index) => {
            let CHName = item?.Certificate?.Type === 1 || (item?.Certificate?.Type === 32768 && item?.Certificate?.NationalCode==="CN")|| item?.Certificate?.Type === 512
            let CHName2 = (item?.Certificate?.Type == 2 && item?.Certificate?.NationalCode == "CN")
            let bigName = (CHName || CHName2) ? item?.Name : item?.GivenName+'/'+item?.Surname
            Travellerarr.push(
                Util.Parse.isChinese()?
                "第"+(index+1)+'位'+'： '+bigName+'\n'+'证件类型：'+Util.Read.typeTocertificate2(item?.Certificate?.Type)+'\n'+"证件号码："+Utils.Read.simpleReplace(item?.Certificate?.SerialNumber)+'\n'+'国籍/地区：'+item?.Certificate?.NationalName+"\n\n"
                :
                (index+1)+'th'+'： '+item?.Name+'\n'+'Certificate Type：'+Util.Read.typeTocertificate2(item?.Certificate?.Type)+'\n'+'Certificate Number：'+Utils.Read.simpleReplace(item?.Certificate?.SerialNumber)+'\n'+'Nationality/Area：'+item?.Certificate?.NationalName+"\n\n"
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
                        this._getApproveInfo(TravellerList,ApproveOrigin,IsNeedApproval,params);
                    })
                })
            } else {
                this._getApproveInfo(TravellerList,ApproveOrigin,IsNeedApproval,params);
            }
        }).catch(error => {
            this.hideLoadingView();
            this._getApproveInfo(TravellerList,ApproveOrigin,IsNeedApproval,params);
        });
    }
    _getApproveInfo = (TravellerList,ApproveOrigin,IsNeedApproval,params) => {
        if (this.props.feeType === 2) {
            this.push('FlightOrderSure', params,ServiceFeesData);
            return;
        }
        let approverInfo = {
            PassengerList: TravellerList,
            ApproveOrigin: ApproveOrigin,
            BusinessType: 1,
            IsNeedApproval: IsNeedApproval,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        }
        this.showLoadingView();
        CommonService.ApproveInfo(approverInfo).then(response => {
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
        const { customerInfo, userInfo, ServiceFeesData} = this.state;
        params.merchantPrice = this._calcuPrice(1)
        this.push('FlightOrderSure', params, ServiceFeesData);
    }

    /**
    * 往返程中的航班信息
    */
    _getflightInfo = (data, ruleData, RuleModelArr,IsNeedApproval) => {

        var id = null;
        var reason = '';
        var reasonEn ='';
        if (ruleData && ruleData.lowPriceReason) {
            id = ruleData.lowPriceReason.Id;
            reason = ruleData.lowPriceReason.Reason;
            reasonEn = ruleData.lowPriceReason.ReasonEn;
        } else {
            id = '0';
        }
        let beforeReason = '';
        let beforeReasonEn = '';
        let beforeId = '';
        if (ruleData && ruleData.beforeDayReason) {
            beforeReason = ruleData.beforeDayReason.Reason;
            beforeReasonEn = ruleData.beforeDayReason.ReasonEn;
            beforeId = ruleData.beforeDayReason.Id;
        }
        let bindProduct = null;
        if (data.SupplierType === 3 && data.CHBindProduct) {
            bindProduct = data.CHBindProduct
        }
        RuleModelArr&&RuleModelArr.map((item)=>{
            item.CustomerReasonId = item.Id
            item.NeedApproval = IsNeedApproval
        })
        var aline = null;
        if (data.LowestFlight) {
            aline = {
                //Id: 0,
                Tax: data.LowestFlight.Tax,
                Tpm: data.LowestFlight.Tpm,
                Price: data.LowestFlight.Price,
                Stop: data.LowestFlight.fltInfo.Stop,
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
        RuleModelArr&&RuleModelArr.map((item)=>{
            if(item.RuleType==1){
                item.LowestFlight = aline ? aline : ''
            }
        })
        var orderModel = {
            TPM: data.TPM,
            Stop: data.fltInfo.Stop,
            SupplierType: data.SupplierType,
            ProductId: data.ProductId,
            RcReasonLst: RuleModelArr,
            // [{
            //     Reason: reason,
            //     ReasonEn:reasonEn,
            //     CustomerReasonId: id,
            //     LowestFlight: aline ? aline : '',
            //     RuleType: 1,
            //     OrderCategoty: 1
            // }, {
            //     Reason: beforeReason,
            //     ReasonEn:beforeReasonEn,
            //     CustomerReasonId: beforeId,
            //     LowestFlight: '',
            //     RuleType: 2,
            //     OrderCategory: 1
            // }, {
            //     ReasonEn:(ruleData && ruleData.cabinDiscountReason) ? ruleData.cabinDiscountReason.ReasonEn : '',
            //     Reason: (ruleData && ruleData.cabinDiscountReason) ? ruleData.cabinDiscountReason.Reason : '',
            //     CustomerReasonId: (ruleData && ruleData.cabinDiscountReason) ? ruleData.cabinDiscountReason.Id : '',
            //     LowestFlight: '',
            //     RuleType: 7,
            //     OrderCategory: 1
            // }]
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
            MealCode:data.fltInfo&&data.fltInfo.meal,
            MealDesc:data.fltInfo&&data.fltInfo.MealDesc,
            CarbonEmission:data.CarbonEmission,
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
        const passengerCount = (employees?.length ?? 0) + (travellers?.length ?? 0);
        const flightCost = (goFlightData?.Price ?? 0) + (goFlightData?.Tax ?? 0);
        let total = flightCost * passengerCount;
        if (backFlightData) {
            // total += (backFlightData.Price + backFlightData.Tax) * (employees.length + travellers.length)
            const { Price = 0, Tax = 0 } = backFlightData || {};
            const passengers = (employees?.length || 0) + (travellers?.length || 0);
            total += (Price + Tax) * passengers;
        }
        const beforTotal = total //记录不包含服务费的总价

        let baseAmount = (goFlightData?.Price ?? 0) + (goFlightData?.Tax ?? 0);
        if (backFlightData) {
            // baseAmount += (backFlightData.Price + backFlightData.Tax) 
            baseAmount += (backFlightData?.Price ?? 0) + (backFlightData?.Tax ?? 0);
        }
        var serviceFee = 0;
        var VipServiceFee = 0;
        if(ServiceFeesData&&ServiceFeesData.ServiceFees && ServiceFeesData.ServiceFees.length>0){
            ServiceFeesData.ServiceFees.map((item,index)=>{
                if (item.FeeValueType == 1) {
                    if (backFlightData && ServiceFeesData.TollType==3) {
                        serviceFee += Number(item.Price * item.CountOfShowDetail);
                    }else{
                        serviceFee += Number(item.Price);
                    }
                    
                }
                else if (item.FeeValueType == 2) {
                    let baseAmount1= baseAmount
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
                    let baseAmount2= baseAmount 
                    item.Price = Number((item.FeeValue * baseAmount2).toFixed(2));
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
                        // singlePrice += insu.PerPrice*insu.Count;
                        singlePrice += obj.detail && obj.detail[0].SalePrice*obj.Count;
                    }
                })
            } else {
                if (insurances) {
                    insurances.forEach(insu => {
                        if ((insu.ShowMode === 1 || insu.ShowMode === 2)&&insu.detail) {
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
                        // singlePrice += obj.PerPrice*obj.Count;
                        singlePrice += obj.detail && obj.detail[0].SalePrice*obj.Count;
                    }
                })
            } else {
                if (insurances) {
                    insurances.forEach(insu => {
                        if ((insu.ShowMode === 1 || insu.ShowMode === 2)&&insu.detail) {
                            // singlePrice += insu.PerPrice*insu.Count;
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
            total += singlePrice;
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
        data.CertificateType = obj&&obj.TypeDesc ;
        data.CertificateId = obj&&obj.Type
        return data
    }

    _InsuranceSelectBtnclick = (item) => {
        item.show = !item.show;
        this.setState({});
    }

    /**
     *  展示保险内容
     */
    _showInsuranceContentClick = (item) => {
        if (!item || !item.detail || item.detail.length === 0) return;
        this.showAlertView(item.detail[0].InsuranceDesc);
    }
    
    _changeUI=()=>{
        const { goFlightData, backFlightData, goRuleModel, backRuleModel } = this.params;
        const { Contact, ApproveOrigin, customerInfo, userInfo, AdditionInfo, travellers, employees,fileList,PdfDictList} = this.state;
        const { feeType,comp_userInfo } = this.props;
        // if(!employees || employees.length==0){
        //     return
        // }
        return(
            <View style={{}}>
                  <PassnegerView
                        userInfo={userInfo}
                        travellers={travellers}
                        employees={employees}
                        customerInfo={customerInfo}
                        from={'flight'}
                        otwThis={this}
                        goFlightData={goFlightData}
                        backFlightData={backFlightData}
                        feeType={feeType}
                    />
                    {
                        (!employees || employees.length==0)?null:
                        (employees[0].cusInsurances&& <CusInsurancesView  cusiItem={employees[0].cusInsurances} otwThis={this}/>) 
                    }
                    <ContactView
                        from={'flight'}
                        model={Contact}
                    />
                    {
                        feeType === 1?
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
                                    fromNo = {2}//国内飞机 BusinessCategory
                                    PdfDictList={fileList&&fileList.length>0 ? PdfDictList :null}
                                />
                                {this._renderPayType()}
                            </View>
                        : null
                    }
                    {
                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.AirContainsAttachment//判断上传附件是否展示
                        ?
                        <View style={{marginTop:10,backgroundColor:'#fff', paddingHorizontal: 20,marginHorizontal:10,paddingVertical:10,borderRadius:6}}>
                             <TouchableOpacity  style={{ flexDirection:'row',alignItems:'center', backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,justifyContent: "space-between",flexWrap:'wrap' }}
                                                onPress={()=>{this._selectFile()}}>
                                    <View style={{flexDirection:'row',alignItems:'center'}}>
                                        {
                                            customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.AirNecessary?
                                            <TitleView2 title={'上传附件'} required={true}></TitleView2>
                                            :
                                            <TitleView2 title={'上传附件'}></TitleView2>
                                        }
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center',paddingVertical:10}}>
                                        <TouchableOpacity style={[{ borderColor: Theme.theme }, styles.borderAll]} 
                                            onPress={()=>{
                                                this._selectFile()
                                            }}
                                        >
                                            <CustomText text='从文件夹上传' style={{color: Theme.theme }} />
                                        </TouchableOpacity>
                                        {
                                          Platform.OS === 'android'?null:
                                            <TouchableOpacity style={[{ borderColor: Theme.theme,marginLeft:5  }, styles.borderAll]} 
                                                onPress={()=>{
                                                this._selectImage()
                                                }}
                                            >
                                                <CustomText text='打开相册或相机' style={{color: Theme.theme }} />
                                            </TouchableOpacity>
                                        }
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
                                <View style={{ flexDirection: 'row',flex:1, height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:4}}>
                                    <CustomText text={item.FileName} style={{flex:3}}></CustomText>                 
                                    <AntDesign name={'delete'} onPress={()=>{
                                        fileList.splice(index,1);
                                        this.setState({})
                                    }} size={20} color={Theme.theme} />
                                </View>  
                            )
                        })
                    }
                    {/* <MailSelectView mailSendInfo={mailSendInfo} MaillingInfo={MaillingInfo} customerInfo={customerInfo} callBack={this._actionAlertClick} feeType={this.props.feeType} /> */}
            </View>
        )
    }

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

    _LeftTitleBtn(){
        this.pop();
    }

    renderBody() {
        const { goFlightData, backFlightData, goRuleModel, backRuleModel,isSingle ,goCityData, arrivalCityData,moreTravel} = this.params;
        const { actionSheetOptions, InvoiceInfo, customerInfo,ReceiveEmail } = this.state;
        const { feeType } = this.props;
        const hasValidSupplierType = [1, 3].includes(goFlightData?.SupplierType) || 
                            [1, 3].includes(backFlightData?.SupplierType);
        return (
            // <View style={{ flex: 1, position: 'relative' }}>
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                <AdContentInfoView adList={this.state.adList} detail_ad={true}/>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled' style={{ marginTop:10 }}>
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                    {
                       feeType === 1 && customerInfo?.Setting?.IsElectronicItinerary && hasValidSupplierType
                        ?
                        <View style={{ backgroundColor: 'white',marginHorizontal:10,borderRadius:6, paddingBottom:10}}>
                            <View style={{backgroundColor: 'white',borderRadius:6}}>
                               <View style={{flexDirection:'row',padding:10,backgroundColor: Theme.yellowBg,borderTopLeftRadius:6,borderTopRightRadius:6}}>
                                    <CustomText style={{paddingLeft:10, color:Theme.theme}} text={'电子行程单（如发票信息开错，请联系您的差旅顾问）'} />
                                </View>
                                <TouchableHighlight underlayColor='transparent' onPress={()=>{this._getInvoice()}}>
                                    <View style={styles.section}>
                                    { 
                                      customerInfo.Setting.IsElectronicItineraryRequired ?
                                        <HighLight style={{}} name={'发票抬头'} /> :
                                        <CustomText style={{}} text={'发票抬头'} />
                                    }
                                        <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                                    </View>
                                </TouchableHighlight>
                            </View>
                            {
                            feeType==2 || !InvoiceInfo?null:
                                <View style={{flexDirection:'row',backgroundColor: 'white',justifyContent:'space-between',alignItems:'center', paddingHorizontal:10}}>
                                    <View style={{ backgroundColor: 'white',flex:15}}>
                                        <View style={{paddingLeft:10,paddingVertical:10}}>
                                            {/* <CustomText style={{}} text={Util.Parse.isChinese()?'发票抬头名称：':''} /> */}
                                            <CustomText style={{flexWrap:'wrap'}} text={InvoiceInfo&&InvoiceInfo.BuyerName} />
                                            { InvoiceInfo&&InvoiceInfo.BuyerNameEn ? <CustomText style={{flexWrap:'wrap',color:Theme.assistFontColor}} text={InvoiceInfo.BuyerNameEn} /> : null }
                                        </View>
                                        <View style={{flexDirection:'row',paddingLeft:10,paddingVertical:10}}>
                                            <CustomText style={{}} text={Util.Parse.isChinese()?'发票类型：':''} />
                                            <CustomText style={{}} text={InvoiceInfo&&InvoiceInfo.BuyerTypeDesc} />
                                        </View>
                                        <View style={{flexDirection:'row',paddingLeft:10,paddingVertical:10}}>
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
                    {this._changeUI()}
                    <View style={{marginBottom:40}}></View> 
                </KeyboardAwareScrollView>
                </ScrollView>
                {this._renderBottomView()}
                <PriceDetailView ref={o => this.priceDetailView = o} {...this.state} {...this.params} merchantPrice={this._calcuPrice(1)} 
                    callBack={()=>{
                        this._showPriceDetail();
                    }}/>
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
   
    _renderBottomView = () => {
        const { customerInfo, showPriceDetail, ServiceFeesData } = this.state;
        let isShowServiceCharge =   ServiceFeesData && ServiceFeesData.IsShowServiceFee;
        return (
            <View style={{ height: 50, flexDirection: 'row', backgroundColor: 'white', alignItems: 'center' }}>
                <CustomText style={{ marginLeft: 10, color:Theme.theme , fontSize: 16,fontWeight:'bold',marginTop:4 }} text={'¥' } />
                <CustomText style={{ color: Theme.theme, fontSize: 20 }} text={this._calcuPrice(0)} />
                {
                    isShowServiceCharge ?
                        <CustomText style={{ color: 'gray', fontSize: 12 }} text='(含服务费)' />
                        : null
                }
                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._showPriceDetail}>
                        <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end", alignItems: "center", height: 50 }}>
                            <CustomText style={{ fontSize: 12, color: 'gray' }} text='明细' />
                            <Ionicons name={showPriceDetail ? 'chevron-up' : 'chevron-down'} size={24} color={'gray'} style={{ marginRight: 5 }} />
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor='transparent' onPress={this._orderBtnClick}>
                        <View style={styles.bottom_btn}>
                            <CustomText style={{ color: 'white' }} text='下一步' />
                        </View>
                    </TouchableHighlight>
                </View>
            </View >
        )
    }
    _renderPayType = () => {
        const { customerInfo } = this.state;
        if (!customerInfo || !customerInfo.Setting) return null;
        return (
            <View style={{ marginTop: 10,marginHorizontal: 10, backgroundColor: 'white', paddingHorizontal: 20, height: 44, flexDirection: 'row', alignItems: 'center',borderRadius:6,justifyContent: 'space-between', }}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                    <CustomText text='支付方式' style={{ fontSize:14,fontWeight:'bold'}} />
                </View>
                <CustomText text={customerInfo.Setting.IsPaymentOnline ? '在线支付' : customerInfo.SettleTypeDesc} style={{fontSize:14}} />
            </View>
        )
    }
}
const getStatePorps = state => ({
    feeType: state.feeType.feeType,
    apply: state.apply.apply,
    comp_userInfo: state.comp_userInfo,
    profileCommonEnum: state.profileCommonEnum,   
})
export default connect(getStatePorps)(FlightCreateOrderScreen);


const styles = StyleSheet.create({
    titleText: {
        fontSize: 18,
        color: Theme.darkColor
    },
    headerView: {
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    bottom_btn: {
        width: 120,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.theme,
        marginRight:10,
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
    row: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        alignItems: 'center',
        height: 44,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
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
    container2:{
        flex:1,
        backgroundColor:'rgba(0, 0, 0, 0.3)',
        justifyContent:'center',
        alignItems:'center'
      },
    alertStyle:{
        width: '80%', 
        backgroundColor:'#fff',
        borderRadius:8,
        padding:10,
    }
})