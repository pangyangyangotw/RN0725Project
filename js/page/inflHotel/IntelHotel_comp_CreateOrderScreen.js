import React from 'react';
import {
    View,
    Text,
    Platform,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import ViewUtil from '../../util/ViewUtil';
import CommonService from '../../service/CommonService';
import CommonEnum from '../../enum/CommonEnum';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Theme from '../../res/styles/Theme';
import ContactView from '../common/ContactView';
import DepartView from '../common/DepartView';
import UserInfoDao from '../../service/UserInfoDao';
import UserInfoUtil from '../../util/UserInfoUtil';
import { connect } from 'react-redux';
import AdditionInfoView from '../common/AdditionInfoView';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import Customer from '../../res/styles/Customer';
import BackPress from '../../common/BackPress';
import PickerHelper from '../../common/PickerHelper';
import AdCodeEnum from '../../enum/AdCodeEnum';
// import HeaderView from './HeaderView';
import CreateOrderPriceView from './CreteOrderPriceView';
import AdContentInfoView from '../common/AdContentInfoView';
import Pop from 'rn-global-modal';
import action from '../../redux/action';
import OpenGetFile from '../../service/OpenGetFile';
import HighLight from '../../custom/HighLight';
import OpenGetPic from '../../service/OpenGetPic';
import MerchantPriceUtil from '../../util/MerchantPriceUtil'
import HeaderView from '../hotel/HeaderView'
import  LinearGradient from 'react-native-linear-gradient';
import {HighLight2,TitleView2} from '../../custom/HighLight';


const screenWidth = Dimensions.get('window').width
class IntelHotel_comp_CreateOrderScreen extends SuperView {

    constructor(props) {
        super(props);
        this.param = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._unmounted = false;
        this._editingBusy = false;
        this.params = this.param.model || {};
        this.paramItems = this.param.item || {};
        this.JourneyId = this.param.JourneyId || 0;
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
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: "white"
        }

        this.backPress = new BackPress({ backPress: () => this._backBtnClick() })
        const { apply } = this.props;
        let share_AllArr = []
        for(let i=0; i<this.params.roomCount; ++i){
            share_AllArr.push([]);
        }
        this.state = {
            // 联系人
            Contact: {
                Name: '',
                Mobile: '',
                Email: ''
            },
            travellers: [],
            // 用户信息
            userInfo: {},
            // 客户配置信息
            customerInfo: {},
            // 费用归属
            ApproveOrigin: apply && apply.ApproveOrigin ? apply.ApproveOrigin : {},
            // 数据字典
            AdditionInfo: apply && apply.Addition ? {
                ...apply.Addition,
                DictItemList: apply.Addition.DictItemList ? apply.Addition.DictItemList : []
            } : {
                    DictItemList: []
            },

            isFirstTip: true,

            /**
             *  预计到店时间 
             */
            LasterLiveTime: Util.Date.toDate(this.params.checkIndate.format('yyyy-MM-dd') + ' 14:00' ),
            /**
             * 入住间数
             */
            roomCount: this.params.roomCount,
            // 公告
            adList: [],

            showPriceDetail: false,

            travPerson:[],

            // chooseLists:null,
            travellers:null,//综合订单 已选出差人

            paymentDesc:'',//支付类型
            shareAllArr:this.props.shareAllArr?this.props.shareAllArr:share_AllArr,

            fileList:[],
            merchantPrice:0,

            nullDictList:[],
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
        const {CityId} = this.params;
        let model = {
            Extra:{CityCode: CityId},
            OrderCategory: CommonEnum.orderIdentification.intlHotel,
        }
        CommonService.GetTravelStandards(model).then(response => {
            this.hideLoadingView();
            if (response?.data?.RuleDesc?.length > 0) {
                Pop.show(
                    <View style={styles.alertStyle}>
                       <View style={{alignItems:'center',justifyContent:'center'}}>
                           <CustomText text={'温馨提示'} style={{margin:6,fontSize:18, fontWeight:'bold'}} />
                       </View>
                       <View style={{width:'100%'}}>
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
                this.showAlertView('国际酒店:不限');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    componentDidMount() {
        const { Contact, ApproveOrigin, travellers,userInfo,AdditionInfo,roomCount } = this.state;
        const {compCreate_bool,comp_userInfo,comp_travelers} = this.props;
        const { roomModel } = this.params;
        // let chooseList;
        // if(compCreate_bool){//判断该综合订单是创建还是继续预订
        //     if(!comp_userInfo&&!comp_userInfo.userInfo&&!comp_userInfo.employees&&!comp_userInfo.travellers&&!comp_userInfo.ProjectId){
        //         return;
        //     }
        //     chooseList = (comp_userInfo&&comp_userInfo.employees).concat(comp_userInfo&&comp_userInfo.travellers)
        // }else{
        //     chooseList=comp_travelers&&comp_travelers.compEmployees.concat(comp_travelers.compTraveler)
        // }
        // let chooseArr = []
        // chooseList&&chooseList.map((item)=>{
        //     chooseArr.push([item])
        // })
        // this.setState({
        //     travellers:chooseArr,
        //     roomCount:chooseArr.length 
        // })
        let list = [];
        let travellersList;
        if(compCreate_bool){
            travellersList = comp_userInfo&&comp_userInfo.employees.concat(comp_userInfo&&comp_userInfo.travellers);
        }else{
            travellersList = comp_travelers&&comp_travelers.compEmployees.concat(comp_travelers&&comp_travelers.compTraveler);
        }
        if(this.params.roomCount==1){
            travellersList.map((item)=>{
                item.shareRoomSelect = true
                list.push(item)
            })
            if(list.length>0){ 
                this.setState({
                    shareAllArr:[list]
                })
            }   
        }
        let list2 = [];
        if(roomCount>1 && travellersList.length>=2){
            travellersList&&travellersList.map((item,index)=>{
                if(index < roomCount){
                    item.shareRoomSelect = true
                    list2.push([item])
                }else{
                    item.shareRoomSelect = false
                }
            })
            this.setState({
                shareAllArr:list2
            }) 
        }
        this.setState({
            travellers: travellersList,
        })
        
        this.backPress.componentDidMount();
        this.showLoadingView();
        CommonService.getUserInfo().then(userInfoRes => {
            if (userInfoRes && userInfoRes.success && userInfoRes.data) {
                
                let userInfo = userInfoRes.data;
                let user = UserInfoUtil.getUser(userInfo);
                if (this.props.apply) {
                    // let passengers = [];
                    // UserInfoUtil.ApplyTravller(this.props.apply, passengers);
                    // UserInfoUtil.ApplyEmployee(this.props.apply, passengers);
                    // let obj = passengers[0];
                    // if (!obj.Id) {
                    //     obj.isTraveller = true;
                    // }
                    // travellers.push([obj]);
                } else {
                    // travellers.push([user]);
                }
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
                    if (response && response.success) {
                        let customerInfo = response.data;
                        this.state.actionSheetOptions = UserInfoUtil.DeliveryItems(customerInfo);
                        CommonService.CurrentDictList({
                            OrderCategory: 6,
                            ShowInApply: false,
                            ShowInDemand: false,
                            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
                        }).then(currentDictList => {
                            this.hideLoadingView();
                            if (currentDictList && currentDictList.success) {
                                customerInfo.DictList = currentDictList.data;
                                // let arr=[]
                                // arr = currentDictList&&currentDictList.data&&currentDictList.data.filter(obj => {
                                //     return obj.ShowInOrder
                                // })
                                // AdditionInfo.DictItemList = arr&&arr.map((item)=>({
                                //     DictCode:item.Code,
                                //     DictEnName:item.EnName,
                                //     DictId:item.Id,
                                //     DictName:item.Name,
                                //     FormatRegexp:item.FormatRegexp,
                                //     Id:item.Id,
                                //     ItemEnName:null,
                                //     ItemId:"",
                                //     ItemInput:"",
                                //     ItemName:"",
                                //     NeedInput:item.NeedInput,
                                //     Remark:item.Remark,
                                //     RemarkNo:item.RemarkNo,
                                //     NextId:item.NextId
                                // }))
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
                    this.toastMsg(error.message);
                    this.hideLoadingView();
                })
            }else{
                this.hideLoadingView();
                this.toastMsg(userInfoRes.message || '获取数据失败');
            }
        }).catch(error => {
            this.toastMsg(error.message);
            this.hideLoadingView();
        })
    
        CommonService.GetAdStrategyContent(AdCodeEnum.hotelOrder).then(response => {
            if (response && response.success) {
                this.setState({
                    adList: response.data
                })
            }
        }).catch(error => {

        })

        let IsExAgreement = false;
        roomModel.RpLabel && roomModel.RpLabel.map(obj => {
            if(obj&&obj.indexOf('价格计划3S协议') > -1){
                IsExAgreement = true
            }
        })

        //服务费
        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }

        let SettleType ;
        if (roomModel.PaymentType === 1) {
            if (roomModel.GuaranteeRules && roomModel.GuaranteeRules.length > 0) {
                SettleType=4
            } else {
                SettleType=2
            }
        }else if (roomModel.PaymentType === 2 && roomModel.NeedCreditCard) {
            SettleType = 6
        } else {
               SettleType=1
        }

        let model={
            OrderCategory:6,
            MatchModel:{
                IsAgreement:this.params.orderModel.IsAgreement,
                IsExAgreement:IsExAgreement,
                SettleType:SettleType
            },
            MassOrderId: this.props.compMassOrderId,
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
        this._unmounted = true;
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
        PickerHelper.hide();
    }
    _selectLaterDate = () => {
        let arr = this._createDateData();
        let checkIn = this.params.checkIndate;
        let lasterCheck = checkIn.addDays(1);
        PickerHelper.create(arr, [arr[0]], (obj) => {
            let date = Util.Date.toDate(checkIn.getFullYear() + '-' + obj.join(' '));
            if (checkIn.getFullYear() !== lasterCheck.getFullYear()) {
                if (date < checkIn) {
                    date = date.addDays(1);
                }
            }
            this.setState({
                LasterLiveTime: date
            })
        })
    }
    _createDateData = () => {
        let checkInDate = this.params.checkIndate;
        let checkIn = Util.formatDate(this.params.checkIndate,'MM-dd');
        let nowDate = new Date();
        let nowHours = nowDate.getHours();
        let nowMins = nowDate.getMinutes();
        let nowYear = nowDate.getFullYear();
        let nowMoth = nowDate.getMonth();
        let nowDay = nowDate.getDate();
        let checkYear = checkInDate.getFullYear();
        let checkMonth = checkInDate.getMonth();
        let checkDay = checkInDate.getDate();
        var hourData = [];

        if (nowHours >= 14 && nowYear == checkYear && nowMoth == checkMonth && nowDay == checkDay) {
            for (let i = nowHours; i < 24; i++) {
                for (let j = 0; j < 60; j++) {
                    if (i == nowHours && j < nowMins) {
                        continue;
                    } else {
                        let obj = null;
                        if (j < 10 && j == 0) {
                            obj = checkIn + ' ' + i + ':' + '0' + j;
                        } else if (j == 30) {
                            obj = checkIn + ' ' + i + ':' + j;
                        } else {
                            continue;
                        }
                        hourData.push(obj);
                    }
                }
            }
        } else {
            for (let i = 14; i < 24; i++) {
                for (let j = 0; j < 60; j++) {
                    let obj = null;
                    if (j < 10 && j == 0) {
                        obj = checkIn + ' ' + i + ':' + '0' + j;
                    } else if (j == 30) {
                        obj = checkIn + ' ' + i + ':' + j;
                    } else {
                        continue;
                    }
                    hourData.push(obj);
                }

            }
        }
        let nextCheckIn = Util.formatDate(checkInDate.addDays(1),'MM-dd');
        for (let i = 0; i <= 6; i++) {
            for (let j = 0; j < 60; j++) {
                let obj = null;
                if (i == 6 && j == 0) {
                    obj = nextCheckIn + ' ' + '0' + i + ':' + '0' + j;
                } else if (i == 6 && i > 0) {
                    break;
                }
                if (j < 10 && j == 0) {
                    obj = nextCheckIn + ' ' + '0' + i + ':' + '0' + j;
                } else if (j == 30) {
                    obj = nextCheckIn + ' ' + '0' + i + ':' + j;
                } else {
                    continue;
                }
                hourData.push(obj);
            }
        }
        return hourData;
    }
    _compOrderBtnClick = (totalPrice) => {
        const { travellers, customerInfo, AdditionInfo, userInfo, ApproveOrigin, Contact, roomCount, LasterLiveTime,shareAllArr,fileList,nullDictList } = this.state;
        const { roomModel, RcReason, ShareRoomApplyFlag,SearchGuestNum } = this.params;
        const {compCreate_bool} = this.props;
        var RcReasons = RcReason&&RcReason.filter(i => i)
        let isEmploy = travellers.some(obj => obj.length === 0);
        if (isEmploy) {
            this.toastMsg('每间房间至少对应一位入住人');
            return;
        }
        if (!LasterLiveTime) {
            this.toastMsg('预计到店时间不能为空');
            return;
        }
        let arrPerson = [];
        let isEmployAlert = false;
        if (shareAllArr && shareAllArr.length > 0 && travellers.length>1) {
            for (const item of shareAllArr) {
                if (item.length < 1) {
                    this.toastMsg('每间房间至少对应一位入住人');
                    isEmployAlert = true
                    break; // 立即停止循环
                }else{
                    item.forEach((obj)=>{
                        arrPerson.push(obj);
                    })
                }
            }
            if (isEmployAlert) {
                return;
            }
        }
        if((roomCount < travellers.length) && (arrPerson.length<travellers.length)){
            this.toastMsg('入住人未选完');
            return;
        }
        let TravellerList = [];
        let OrderSureTravellerList = [];
        let CertificateNum='';
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
        for (let index = 0; index < travellers.length; index++) {
            const obj = travellers[index];
            let additionList = compCreate_bool ? obj.Addition : (obj.AdditionInfo?obj.AdditionInfo:obj.Addition)
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
                   const isCascadeChild = customerInfo.EmployeeDictList[i].BeforeParentNameList && customerInfo.EmployeeDictList[i].BeforeParentNameList.length > 0;
                   if (customerInfo.EmployeeDictList[i].IsRequire && (customerInfo.EmployeeDictList[i].ShowInOrder || isCascadeChild)) {
                           if (itemIndex.NeedInput && !itemIndex.ItemName) {
                               this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                               return;
                           }
                   }
               }
           }
        }
        let alertWarning = 0;
        travellers.forEach((obj, roomIndex) => {
            let SeqNo = 0;
            if(!obj.GivenName){
                obj.GivenName = obj.FirstName
                obj.Surname = obj.LastName
            }
            OrderSureTravellerList = OrderSureTravellerList.concat(obj);
                if (obj && obj.Name) {
                    let type = '';
                    let referId = '';
                    let TypeDesc = '';
                    SeqNo = SeqNo + 1;
                    if (!obj.isTraveller) {
                        type = 1;
                        referId = obj.PassengerOrigin&&obj.PassengerOrigin.EmployeeId
                        TypeDesc="员工"
                    } else {
                        type = 2;
                        referId = obj.PassengerOrigin&&obj.PassengerOrigin.EmployeeId ? obj.PassengerOrigin.EmployeeId : 0;
                        TypeDesc="常旅客"
                    }
                    if (!obj.Mobile) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}} 手机号不能为空', obj.Name));
                        alertWarning = 1
                        return;
                    }else if (!Util.RegEx.isMobile(obj.Mobile)) {
                        this.toastMsg('手机号格式不正确');
                        alertWarning = 1
                        return;
                    } 
                    if (!obj.GivenName || !obj.Surname) { 
                        this.toastMsg("需要先维护英文姓名才能进行预定");
                        alertWarning = 1
                        return;
                    }else if (Util.RegEx.isEnName(obj.GivenName) || Util.RegEx.isEnName(obj.Surname)) {
                        this.toastMsg('英文姓名只能包含字母');
                        alertWarning = 1
                        return;
                    }
                    if(roomModel.IsNeedIDCard){
                        if(obj.CertificateId==1){
                            CertificateNum=obj.CertificateNumber
                        }else{
                            if (obj.Certificate && typeof(obj.Certificate) === 'string') {
                                let CertificateList = JSON.parse(obj.Certificate) || [];
                                let CertificateNums = CertificateList.find(item => item.Type === 1);
                                CertificateNum =CertificateNums&&CertificateNums.SerialNumber;
                            }                      
                     }
                    }
                    let model = {
                        Name:obj.Surname+'/'+obj.GivenName,
                        FirstName:obj.GivenName,
                        LastName:obj.Surname,
                        OriginType: type,
                        ReferId: referId,
                        Phone: obj.Mobile ? obj.Mobile : '',
                        Email: obj.Email ? obj.Email : '',
                        RoomNumber:obj.RoomNumber,
                        SeqNo: SeqNo,
                        CheckInTypeOfCertificate:roomModel.IsNeedIDCard?1:'',
                        CheckInCertificate: roomModel.IsNeedIDCard?CertificateNum?CertificateNum:'':'',
                        PassengerOrigin:obj.PassengerOrigin,
                        CostCenter: obj.CostCenter,
                        IsVip: obj.IsVip,
                        Nationality: obj.Nationality,
                        NationalityCode: obj.NationalityCode,
                        NationalName: obj.NationalName,
                        NationalCode: obj.NationalCode,
                        // Addition:obj.Addition?obj.Addition:obj.AdditionInfo,
                        Addition:obj.AdditionInfo?obj.AdditionInfo:obj.Addition,
                        HotelCardTravellerList:obj.HotelCardTravellerList,
                        HotelCardTraveller:obj.CardTravel&&[0]&&obj.CardTravel[0].SerialNumber,
                        HotelGroupId:obj.CardTravel&&[0]&&obj.CardTravel[0].HotelGroupId,
                        HotelGroupName:obj.CardTravel&&[0]&&obj.CardTravel[0].HotelGroupName,
                    }
                    TravellerList.push(model);
                }                
            })
        
        const totalCount = shareAllArr.reduce((sum, subArr) => sum + subArr.length, 0);//入住人总数
        if(totalCount < roomCount * SearchGuestNum){
            this.showAlertView('您选择了2 人一间的房间，为顺利提交订单和入住，请在提交预订前完善每间房的同住人信息，确保信息与实际入住人完全一致。', () => {
                return ViewUtil.getAlertButton('确定', () => {
                    this.dismissAlertView();
                })
            });
            return;
        }
        let addpersons = [];//添加的同住人
        shareAllArr.map((item,index)=>{
            item.map((obj)=>{
                if(obj.IsTempCustomer){
                    addpersons.push(obj);
                }
            })
        })
        
        if(roomModel.IsNeedIDCard){
            if(!CertificateNum){
                this.toastMsg('入住人身份证号码不能为空' + '不能为空');
                return            
            }
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
            if (customerInfo.DictList) {
                const visibleCompanyIdSet = getVisibleDictIdSet(customerInfo.DictList, customerInfo.DictMapList, AdditionInfo && AdditionInfo.DictItemList);
                for (let i = 0; i < customerInfo.DictList.length; i++) {
                    const obj = customerInfo.DictList[i];
                    if (!visibleCompanyIdSet.has(obj.Id)) {
                        continue;
                    }
                    let dicItem = AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item => 
                        // obj.NeedInput ? item.DictName === obj.Name : item.DictId === obj.Id
                        item.DictCode === obj.Code
                    );
                    let regex=new RegExp(dicItem?.FormatRegexp)
                    const isCascadeChild = obj.BeforeParentNameList && obj.BeforeParentNameList.length > 0;
                    if (obj.IsRequire && (obj.ShowInOrder || isCascadeChild)) {
                        if (userInfo && userInfo.Customer.Id === Customer.DRHJ && obj.Name === '实施阶段') {
                            continue;
                        }
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
            if (ApproveOrigin.OriginType === 1 && ApproveOrigin.ProjectId === '0') {
                let proLablel = customerInfo.Setting.ProjectLabel ? customerInfo.Setting.ProjectLabel : '项目出差';
                this.toastMsg('请选择' + proLablel);
                return;
            }
            if (ApproveOrigin.OriginType === 3 && ApproveOrigin.ApproverId === '0') {
                this.toastMsg('请选择授权人');
                return;
            }
        }

        const setting = customerInfo.Setting;
        if(setting&&setting.AttachmentConfig&&setting.AttachmentConfig.ForeignHotelNecessary){
            if(fileList.length==0){
                this.toastMsg('未上传附件');
                return;
            }
        }
        
        let OrderReason = {
            CustomerReasonId: this.params.RcReason ? this.params.RcReason.Id : '',
            Reason: this.params.RcReason ? this.params.RcReason.Reason : '',
            LowestFlight: '',
            RuleType: 5,
            OrderCategory: 4
        }
        // this.params.RcReason.map((item)=>{
        //     CustomerReasonId:this.params.RcReason.Id,
        // })
        let OrderReasons = 
        RcReasons&&RcReasons.map(item => ({  
                CustomerReasonId: item.Id ,
                Reason: item.Reason,
                LowestFlight: '',
                RuleType: 5,
                OrderCategory: 4,
                ReasonCode:item.Reason?item.Reason.ReasonCode:''
            }))   
        const { checkIndate, liveDay, orderModel, roomIdModel, LimitPrice, ViolationMode, RcModel } = this.params;
        let CheckOutDate = checkIndate.addDays(liveDay);
        let companyCost = 0;
        let peronalCost = 0;
        if (RcModel && RcModel.ViolationMode == 3 && parseFloat(RcModel.PriceLimit) < roomModel.AvgPrice) {
            companyCost = RcModel.PriceLimit * liveDay * roomCount;
            peronalCost = (parseFloat(roomModel.AvgPrice) - parseFloat(RcModel.PriceLimit)) * liveDay * roomCount;
        } else {
            companyCost = roomModel.AvgPrice * liveDay * roomCount;
        }
        let SettleType ;
        if (roomModel.PaymentType === 1) {
            if (roomModel.GuaranteeRules && roomModel.GuaranteeRules.length > 0) {
                SettleType=4
            } else {
                SettleType=2
            }
        }else if (roomModel.PaymentType === 2 && roomModel.NeedCreditCard) {
            SettleType = 6
        } else {
               SettleType=1
        }
        let order = {
            Contact: Contact,
            CheckInDate: checkIndate.format('yyyy-MM-dd', true),
            CheckOutDate: CheckOutDate.format('yyyy-MM-dd', true),
            RoomCount: roomCount,
            SearchGuestNum: this.params.SearchGuestNum,
            NightCount: liveDay,
            LastCheckInTime: LasterLiveTime.format('yyyy-MM-dd HH:mm', true),
            GuaranteeRule: roomModel.GuaranteeRules,
            FeeType: this.props.feeType,
            IsAgreement: orderModel.IsAgreement,
            ApplyId: this.props.apply ? this.props.apply.Id : 0,
            CompanyAmount: companyCost,
            PersonalAmount: peronalCost,
            SettleType: SettleType,
            Domestic:false,
            ShareRoomApplyFlag:ShareRoomApplyFlag,
            ExcessAmount:LimitPrice
        }
        
        const baseCompanyDictList = customerInfo && Array.isArray(customerInfo.DictList) ? customerInfo.DictList : [];
        const nullDictList2 = baseCompanyDictList.map((item) => ({
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
        }));
        AdditionInfo.DictItemList && AdditionInfo.DictItemList.forEach(item => {
            const dictId = item && (item.DictId || item.Id);
            if (!dictId) return;
            let index = nullDictList2.findIndex(e => e && e.Id == dictId);
            if (index > -1) {
                nullDictList2[index] = Object.assign({}, nullDictList2[index], item);
            }
        })
        const childIdSet = new Set();
        customerInfo && Array.isArray(customerInfo.DictList) && customerInfo.DictList.forEach((cfg) => {
            if (cfg && cfg.NextId) childIdSet.add(cfg.NextId);
        });
        const visibleCompanyIdSet = getVisibleDictIdSet(customerInfo && customerInfo.DictList, customerInfo && customerInfo.DictMapList, nullDictList2);
        AdditionInfo.DictItemList = nullDictList2.filter((it) => {
            const dictId = it && (it.DictId || it.Id);
            if (!dictId) return false;
            if (!childIdSet.has(dictId)) return true;
            return visibleCompanyIdSet && visibleCompanyIdSet.has(dictId);
        })
        //合并添加的同住人
        TravellerList = [...TravellerList,...addpersons];
        var requestModel = {
            AdditionInfo: AdditionInfo,
            ApproveOrigin: ApproveOrigin,
            Customers: TravellerList,
            Order: order,
            RatePlan: roomModel,
            Hotel: orderModel,
            Room: roomIdModel,
            OrderReasons: OrderReasons,
            IgnoreConfirm: false,
            Platform: Platform.OS,
            CityId: this.params.CityId,
        }
        let AttachmentModel = {
            AttachmentItems:fileList
        }
        let params = Object.assign({ requestModel, from: 'hotel',AttachmentModel, Travellers: OrderSureTravellerList,totalPrice:totalPrice }, this.params, this.state);
        if (this.props.feeType === 2) {
            this.push('InterHotelOrderSure', params);
            return;
        }

        let currentUser = UserInfoUtil.getUser(userInfo);

        let PassengerList = [
            {
                Name: currentUser.Name,
                PassengerType: '1',
                Certificate: {
                    SerialNumber: currentUser.CertificateNumber,
                    Type: Util.Read.certificateType(currentUser.CertificateType ? currentUser.CertificateType : '身份证')
                },
                PassengerOrigin: {
                    EmployeeId: currentUser.Id,
                    TravellerId: '0',
                    Type: '1'
                }
            }
        ];
        let isNeedApproval = (RcModel && (RcModel.CityLevelLimit || RcModel.StarRateLimit || RcModel.AdvanceDayLimit) && RcModel.ViolationMode === 2 || ViolationMode==2)?true:false
        
        // this.getTravellerUpdateCheck(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params,TravellerList);
        this._getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params);
    }
    getTravellerUpdateCheck(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params,TravellerList) {
        const {shareAllArr} = this.state;
        let model = {
            OrderCategory: 7,
            Travellers: TravellerList
        }
        let Travellerarr = []
        let Travellerarr1 = []
        shareAllArr.forEach((item)=>{
            Travellerarr=item.map((item1)=>{
                   return item1.Name
            })
            let stringName = Travellerarr.join(',')
            Travellerarr1.push(
                '房间'+item?.[0]?.RoomNumber+"\n"+'入住人：'+stringName+"\n"+'入住人数：'+item.length+"\n\n"
            )
        })
        let massage = Util.Parse.isChinese() ? '订单提交后旅客信息会更新，请您及时通知旅客本人\n\n' : 'Passenger info will update after submission. Please notify the passenger promptly.\n\n';
        let masseges = massage + Travellerarr1
        this.showLoadingView();
        CommonService.MassOrderTravellerUpdateCheck(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView(masseges, () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                    }, '确定', () => {
                        this.dismissAlertView(); 
                        this._getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params);
                    })
                })
            } else {
                this._getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params);
            }
        }).catch(error => {
            this.hideLoadingView();
            this._getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params);
        });
    }

    _getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params) {
        let approveInfo = {
            PassengerList: PassengerList,
            ApproveOrigin: ApproveOrigin,
            BusinessType: 7,
            // IsNeedApproval: (LimitPrice < roomModel.AvgPrice) && ViolationMode === 2,
            IsNeedApproval: isNeedApproval,
            IsMassOrder:true, //是不是综合订单
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        }
        if (alertWarning != 1) {
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
    }

    _toNextJudge = (params) => {
        const { customerInfo, userInfo } = this.state;
        params.JourneyId = this.JourneyId
        this.push('InterHotelOrderSure', params);
    }
    _changeLiveday = (index) => {
        const {travellers} = this.state
        const {compCreate_bool,comp_userInfo,comp_travelers} = this.props;
        let chooseList;
        if(compCreate_bool){//判断该综合订单是创建还是继续预订
            if(!comp_userInfo&&!comp_userInfo.userInfo&&!comp_userInfo.employees&&!comp_userInfo.travellers&&!comp_userInfo.ProjectId){
                return;
            }
            chooseList = (comp_userInfo&&comp_userInfo.employees).concat(comp_userInfo&&comp_userInfo.travellers)
        }else{
            chooseList=comp_travelers&&comp_travelers.compEmployees.concat(comp_travelers.compTraveler)
        }
        let roomPersonArr = []
        travellers&&travellers.map((roomPersonsList)=>{//遍历出住房人数
            roomPersonsList&&roomPersonsList.map((item)=>{
                roomPersonArr.push(item)
            })
            // roomPersonArr.push(item)
        })

        
        if (index === 0) {
            if (this.state.roomCount === 1) {
                this.toastMsg('最少入住1间');
                return;
            } else {
                this.state.roomCount--;
                travellers.splice(travellers.length - 1, 1);
            }
        } else {
            if(this.state.roomCount < chooseList.length){
                this.state.roomCount++;
                travellers.push([]);
            }else{
                this.toastMsg('房间数不能大于出差人数！')
            }
        }
        this.setState({});
    }
   
    /**
     * 添加入住人 判断是否有权限添加
     */
    _addRoomOthers = (data) => { 
        const {travellers} = this.state;
        const {compCreate_bool,comp_userInfo,comp_travelers} = this.props;
        let chooseList;//综合所选订单人数
        if(compCreate_bool){//判断该综合订单是创建还是继续预订
            if(!comp_userInfo&&!comp_userInfo.userInfo&&!comp_userInfo.employees&&!comp_userInfo.travellers&&!comp_userInfo.ProjectId){
                return;
            }
            chooseList = (comp_userInfo&&comp_userInfo.employees).concat(comp_userInfo&&comp_userInfo.travellers)
        }else{
            chooseList=comp_travelers&&comp_travelers.compEmployees.concat(comp_travelers.compTraveler)
        }
        
        let roomPersonArr = []
        travellers&&travellers.map((roomPersonsList)=>{//遍历出住房人数
            roomPersonsList&&roomPersonsList.map((item)=>{
                roomPersonArr.push(item)
            })
        })

        function diffrence(a,b){//计算两个对象数组的差集
            a = a.map(JSON.stringify);
            b = b.map(JSON.stringify);
            return a.concat(b).filter(v => !a.includes(v) || !b.includes(v)).map(JSON.parse)
        }
        let selectList = diffrence(roomPersonArr,chooseList) //除去住房人数后的人
        if(roomPersonArr.length>=chooseList.length){//判断酒店入住人数不能大于综合订单所选人数
            this.toastMsg('入住人超过总人数，请先删除')
        }else{
            this.push('HotelChoosePersonScreen', {selectList:selectList,callBack:(obj)=>{
                obj.map((item)=>{
                    data.push(item);
                })
                this.setState({})
            }})
        } 
    }
    /**
     * 删除入住人
     */
    _deleteRoomLive = (data, index) => {

        data.splice(index, 1);
        this.setState({});
    }
    /**
     * 显示价格信息
     */
    _showPriceDetail = (merchantPrice) => {
        const { customerInfo } = this.state;
        const { roomModel, RcModel } = this.params;
        // if (roomModel.PaymentType === 1) return null;
        // 1、支付方式 现付的话 担保？信用卡担保：前台现付       2、预付  担保？信用卡担保： SettleTypeDesc

        let paymentDesc = '';
        if (roomModel.PaymentType === 1) {
            if (roomModel.GuaranteeRules && roomModel.GuaranteeRules.length > 0) {
                paymentDesc = '信用卡担保';
            } else {
                paymentDesc = '前台现付';
            }
        }else if (roomModel.PaymentType === 2 && roomModel.NeedCreditCard) {
                paymentDesc = '信用卡预付';
                // paymentDesc = 6
        } else {
                paymentDesc = customerInfo.SettleTypeDesc;
        }
        this.setState({
            paymentDesc:paymentDesc,
            merchantPrice:merchantPrice,
        })

        if (this.state.showPriceDetail) {
            this.setState({
                showPriceDetail: false
            }, () => {
                this.priceView.hide();
            })
        } else {
            this.setState({
                showPriceDetail: true,
            }, () => {
                this.priceView.show();
            })
        }
    }

    renderBody() {
        const { compCreate_bool,comp_userInfo,comp_travelers } = this.props;
        const { Contact, ApproveOrigin, customerInfo, userInfo, AdditionInfo, LasterLiveTime,ServiceFeesData,travellers,paymentDesc,fileList,merchantPrice,PdfDictList } = this.state;
        const { roomModel } = this.params;
        let venderAlert = "该价格可积分。请在预定时填写会员号，并在入住时将会员信息提供给酒店，具体积分规则以酒店确认为准。";
        let noVenderAlert = "该价格须以会员身份入住才可积分。请在入住时将会员信息提供给酒店，具体积分规则以酒店确认为准。";
        return (
            <LinearGradient style={{ flex: 1, position: 'relative', }} start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} colors={[Theme.theme,Theme.normalBg]}>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this.pop()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText text={'订单填写'} style={{fontSize:16, color:'#fff'}} />
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <AdContentInfoView adList={this.state.adList} detail_ad={true}/>
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <HeaderView {...this.params}  paramItems={this.paramItems} otwThis={this} userInfo={userInfo} />
                    <View style={{marginHorizontal:10,padding:10,backgroundColor:'#fff',borderRadius:6,marginTop:10}}>
                     {/* {this._renderSelectRoom()} */}
                     {/* {this._compRenderTravellers()} */}
                     {
                        roomModel.IsRewardPoint?
                            <View style={{marginHorizontal:10,marginTop:10,backgroundColor:'#fff',padding:15,borderRadius:6}}>
                                <TitleView2 title={'积分规则'}></TitleView2>
                                <CustomText text={(roomModel.VendorCode==='TVP' || roomModel.SubChannel==='amadeus')?venderAlert:noVenderAlert} style={{color:Theme.assistFontColor,marginTop:10}} ></CustomText>
                            </View>
                        :null
                     }
                     {
                        // this.params.roomCount < (travellers&&travellers.length) ? 
                        //     this._renderTravellers2()
                        // : 
                        // this._compRenderTravellers()
                        this._renderTravellers2()
                     }
                    </View>
                     <View style={styles.row}>
                        <CustomText text={Util.Parse.isChinese()?'预计到店':'Latest Arrival Time'} style={{  }} />
                        <CustomText text={LasterLiveTime ? LasterLiveTime.format('yyyy-MM-dd HH:mm:ss') : '预计到店'} style={{  color: LasterLiveTime ? Theme.theme : "lightgray" }} onPress={this._selectLaterDate} />
                    </View>
                    {
                        roomModel.PaymentType==1 && !roomModel.HasGuarantee?
                        <View style={{ backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:6}}>
                            <CustomText text={'如您的到店时间晚于18:00，为保证您的房间，请联系酒店进行信用卡担保。未担保的预定，酒店有权根据当天入住情况取消未担保的酒店预定。'} style={{fontSize:11, color:'red'}} ></CustomText>
                        </View>:null
                    }
                    <AdditionInfoView
                        customerInfo={customerInfo}
                        userInfo={userInfo}
                        AdditionIfo={AdditionInfo}
                        ApproveOrigin={ApproveOrigin}
                        fromNo = {64}//港澳台及国际酒店  BusinessCategory
                        PdfDictList={fileList&&fileList.length>0 ? PdfDictList :null}
                    />
                    {
                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.ForeignHotelContainsAttachment//判断上传附件是否展示
                        ?
                        <View style={{marginTop:10,backgroundColor:'#fff', paddingHorizontal: 20,marginHorizontal:10,paddingVertical:10,borderRadius:6,marginBottom:10}}>
                             <TouchableOpacity  style={{ flexDirection:'row',alignItems:'center', backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,justifyContent: "space-between",flexWrap:'wrap'}}
                                                onPress={()=>{this._selectFile()}}>
                                    {
                                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.ForeignHotelNecessary?
                                        <TitleView2 title={'上传附件'} required={true}></TitleView2>
                                        :
                                        <TitleView2 title={'上传附件'}></TitleView2>
                                    }
                                    {/* <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} style={{ marginLeft: 5 }} /> */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center',paddingVertical:10  }}>
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
                                            </TouchableOpacity>}
                                    </View>
                            </TouchableOpacity>
                            <View style={{ backgroundColor: 'white', justifyContent:'space-between',}}>
                                    <CustomText text={'单个文件最大5MB，数量最多5个，格式为:'} style={{fontSize:11, color:'red'}} ></CustomText>
                                    <CustomText text={'jpg,png,jpeg,bmp,gif,xlsx,xls,txt,doc,docx,md,pdf,ppt,pptx,wps;'} style={{fontSize:11, color:'red'}}></CustomText>                                  
                            </View>
                        </View>
                        :null
                    }
                    {
                       fileList&&fileList.map((item,index)=>{
                            return(
                                <View style={{ flexDirection: 'row',flex:1, height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:4}}>
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
                <CreateOrderPriceView ref={o => this.priceView = o} {...this.params} ServiceFeesData={ServiceFeesData} roomCount={this.state.roomCount} travellers={travellers} paymentDesc={paymentDesc} merchantPrice={merchantPrice}/>
                {this._renderBottomView()}
            </LinearGradient>
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
                        orderCategory:CommonEnum.CategogryId.intlHotel,
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

    // 选择房间
    _renderSelectRoom = () => {
        return (
            <View style={{ backgroundColor: 'white', height: 40, flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', borderBottomColor: Theme.lineColor, borderBottomWidth: 1,marginTop:10 }}>
                <TouchableHighlight underlayColor='transparent' style={{marginLeft:5}} onPress={this._changeLiveday.bind(this, 0)}>
                    <AntDesign name={'minus'} size={40} color={'lightgray'} />
                </TouchableHighlight>
                <Text allowFontScaling={false} style={{ fontSize: 15 }}>{I18nUtil.translate('住') + ' ' + this.state.roomCount + ' ' + I18nUtil.translate('间')}</Text>
                <TouchableHighlight underlayColor='transparent' style={{marginRight:10}} onPress={this._changeLiveday.bind(this, 1)}>
                    <Ionicons name={'ios-add'} size={45} color={'lightgray'} />
                </TouchableHighlight>
            </View>
        )
    }

    _deleteSharePerson=(item,i,index1)=>{
        if (this._unmounted) return;
        this.setState(prev => {
            const shareAllArr = Array.isArray(prev.shareAllArr) ? prev.shareAllArr.map(r => (Array.isArray(r) ? [...r] : [])) : [];
            const travellers = Array.isArray(prev.travellers) ? prev.travellers.map(t => ({ ...t })) : [];
            const room = shareAllArr?.[i];
            const target = room?.[index1];
            if (!room || !target) return null;

            for (let k = 0; k < travellers.length; k++) {
                if (travellers[k]?.Name === target?.Name) {
                    travellers[k].shareRoomSelect = false;
                }
            }
            room.splice(index1, 1);
            shareAllArr[i] = room;
            return { shareAllArr, travellers };
        });
    }

    _clickChoosePerson=(index)=>{
        const { travellers , shareAllArr} = this.state;
        // if(shareAllArr[index].length>1){
        //    this.toastMsg('一间房最多住两人');
        //    return
        // }
        let falseArr = [];
        travellers&&travellers.map((item)=>{
            if(!item.shareRoomSelect){
                falseArr.push(item);
            }
        })
        if( falseArr.length==0 ){
            if(shareAllArr&&shareAllArr?.[index]?.length>0){
                this.toastMsg('每间房至少有一位出行人，如果出行人已选完，可删除重新选择');
            }else{
                this.toastMsg('入住人已选完，可删除重新选择'); 
            }
            return;
        }
        this.push('ChooseLivePersonScreen',{
            travellers:travellers,
            shareSingleArr:shareAllArr[index],
            shareCallBack:(travellers,backSingleArr)=>{
                if(backSingleArr && backSingleArr.length>0){
                    backSingleArr.map((item,index)=>{
                        if(index === 1){
                            item.SeqNo = 2
                        }
                    })
                    //backSingleArr里的item重新排序，item.Id存在的排在第一个
                    backSingleArr.sort((a, b) => {
                        return a.Id ? -1 : 1;
                    });
                }
                shareAllArr[index] = backSingleArr
                this.setState({
                    travellers:travellers,
                    shareAllArr:shareAllArr
                },()=>{
                    this.props.setHotelShareArr(shareAllArr);
                })
            }
        });
       
    }


    _addSharePerson = (index) => {
        const { travellers , shareAllArr} = this.state;
        let obj = {Name:null, Mobile:null,Email:null,NationalCode:null,NationalName:null,IsTempCustomer:true,Phone:null,SeqNo:9}
        this.push('HotelAddPersonEditScreen',{
            passenger: obj,
            intlHotel:true,
            callBack:(reason, i)=>{
                shareAllArr[index].push(reason);
                this.setState({
                    shareAllArr:shareAllArr,
                })
            }
        })
    }

    _renderTravellers2 = () => {
        const { roomCount,shareAllArr,travellers } = this.state;
        const {SearchGuestNum} = this.params;
        let roomNumList = [];
        for(let i=0; i<roomCount; ++i){
            roomNumList.push(i);
        }
        let falseArr = [];
        travellers && travellers.length>1 && travellers.map((item)=>{
            if(!item.shareRoomSelect){
                falseArr.push(item);
            }
        })
        return(
            <View>
                 {
                    roomNumList&&roomNumList.map((i)=>{
                        return(
                            <View style={{ flexDirection: 'row', backgroundCoor: 'white', borderBottomColor: Theme.lineColor, borderBottomWidth: 1, backgroundColor:'#fff' }} >
                                <View style={{  }}>
                                    <View style={{flexDirection:'row'}}>
                                        <Text style={{ padding: 10 }}>{I18nUtil.translate('房间')}{parseInt(i) + 1}</Text>
                                        {/* <Text style={{ padding: 10, color:Theme.theme }}>{I18nUtil.translate('添加入住人')}</Text> */}
                                        {
                                        // SearchGuestNum*roomCount === travellers?.length || shareAllArr&&shareAllArr[i].length>1 ? null:
                                            <TouchableOpacity onPress={()=>{falseArr.length==0 && shareAllArr&&shareAllArr?.[i]?.[0]?.PassengerOrigin?.EmployeeId ? this._addSharePerson(i) : this._clickChoosePerson(i)}}>
                                            { falseArr.length==0?
                                                shareAllArr?.[i]?.length<SearchGuestNum ?
                                                <Text style={{ padding: 10, color:Theme.theme }}>{I18nUtil.translate('添加入住人')}</Text> : null
                                                :
                                                <Text style={{ padding: 10, color:Theme.theme }}>{I18nUtil.translate('添加入住人')}</Text>
                                            }
                                            </TouchableOpacity>
                                        }
                                    </View>
                                    {
                                        shareAllArr&&shareAllArr[i]&&shareAllArr[i].map((item,index)=>{
                                            item.RoomNumber = i+1;
                                           return (
                                            <View style = {{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:10,backgroundColor:'#fff'}} key={index}>
                                            <TouchableOpacity onPress={()=>{this._deleteSharePerson(item,i,index)}} style={{marginRight:10 }} underlayColor='transparent'>
                                                <AntDesign name={'delete'} size={20} color={Theme.theme} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={()=>{this._toClickEdit(item,i,index)}} style={{flexDirection:'row',justifyContent:'space-between',marginLeft:10,paddingVertical:10,width:screenWidth-100,alignItems:'center'}}>
                                                <View style={{flexDirection:'column'}}> 
                                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                        <CustomText text={'英文名' } />
                                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                        <CustomText text={'：' } />
                                                        <CustomText text={item.GivenName?item.GivenName:'请填写英文名'} style={{color:item.GivenName?'black':Theme.darkColor}} />
                                                    </View> 
                                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                        <CustomText text={'英文姓' } />
                                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                        <CustomText text={'：' } />
                                                        <CustomText text={item.Surname?item.Surname:'请填写英文姓'} style={{color:item.Surname?'black':Theme.darkColor}}/>
                                                    </View>
                                                </View> 
                                                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center'  }}>
                                                    <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                                                </View>
                                            </TouchableOpacity>
                                            </View>
                                           )
                                        })
                                    }
                                 </View>
                            </View>
                        )
                    })
                 }
            </View>
        )
    }

    _toClickEdit = (data,j,index) => {
        if (!data || this._editingBusy || this._unmounted) return;
        this._editingBusy = true;
        const {  customerInfo } = this.state;
        const roomModel = this.params?.roomModel || {};
        if (!data.AdditionInfo) {
            data.AdditionInfo = data.AdditionDict
        }
        if(data.IsTempCustomer){
            this.push('HotelAddPersonEditScreen',{
                passenger: data,
                intlHotel:true,
                callBack:(reason, i)=>{
                    this._editingBusy = false;
                    if (this._unmounted || !reason) return;
                    this.setState(prev => {
                        const shareAllArr = Array.isArray(prev.shareAllArr) ? prev.shareAllArr.map(r => (Array.isArray(r) ? [...r] : [])) : [];
                        if (!shareAllArr?.[j]?.[index]) return null;
                        shareAllArr[j][index] = reason;
                        return { shareAllArr };
                    });
                }
            })
        }else{
            this.push('InterHotelEditPassengerScreen', {
                customerInfo: customerInfo,
                passenger: data,
                IsNeedIDCard: roomModel.IsNeedIDCard,
                // IsRewardPoint:roomModel.IsRewardPoint,
                IsRewardPointTVP:roomModel.IsRewardPoint && (roomModel.VendorCode==='TVP' || roomModel.SubChannel==='amadeus'),
                noComp:true,//判断不是综合订单
                callBack: (reason, i) => {
                    this._editingBusy = false;
                    if (this._unmounted || !reason) return;
                    this.setState(prev => {
                        const travellers = Array.isArray(prev.travellers) ? prev.travellers.map(t => ({ ...t })) : [];
                        const shareAllArr = Array.isArray(prev.shareAllArr) ? prev.shareAllArr.map(r => (Array.isArray(r) ? [...r] : [])) : [];
                        for (let k = 0; k < travellers.length; k++) {
                            if (travellers[k]?.Name === reason?.Name) {
                                travellers[k] = reason;
                            }
                        }
                        if (!shareAllArr?.[j]?.[index]) return null;
                        shareAllArr[j][index] = reason;
                        return { travellers, shareAllArr };
                    });
                    // data = reason
                    data.CertificateNumber = i
                    data.CertificateType = '身份证'
                    data.CertificateId = 1
                }
            })
        }
        setTimeout(() => {
            this._editingBusy = false;
        }, 800);
    }

    _compRenderTravellers = () => {
        const { roomCount, travellers } = this.state;
        const { compCreate_bool,comp_userInfo,comp_travelers } = this.props;
        return (
            <View style={{ marginTop: 10, backgroundColor: "white" }}>
                {
                    travellers&&travellers.map((item, index) => {
                        item.RoomNumber = index+1;
                        return (
                            <View key={index}>
                                <View style={{ flexDirection: 'row', backgroundColor: 'white', borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
                                    <View style={{ justifyContent: 'center' }}>
                                        <Text style={{ padding: 10 }}>{I18nUtil.translate('房间')}{parseInt(index) + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {/* {
                                            this._compAbloutLiveNumber(item)
                                        } */}
                                        {
                                            this._abloutLiveNumber(item)
                                        }
                                    </View>
                                </View>
                                {/* <View style={{ backgroundColor: 'white', padding: 15, paddingLeft: 10, justifyContent: 'space-between' }}>
                                    <CustomText style={{ color: Theme.theme }} text={'新增入住人'} onPress={this._addRoomOthers.bind(this, item)} />
                                </View> */}
                            </View>
                        )
                    })
                }
            </View>
        )
    }

    _abloutLiveNumber = (data) => {
        const { roomModel } = this.params;
        const { travellers,travPerson,customerInfo } = this.state;
        if(!data.GivenName){
            data.GivenName = data.FirstName
            data.Surname = data.LastName
        }
        return (
            <View>
                <View  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, }}>
                    {/* <TouchableHighlight onPress={this._deleteRoomLive.bind(this, data)} style={{ width: 35 }} underlayColor='transparent'>
                        <AntDesign name={'delete'} size={26} color={Theme.theme} />
                    </TouchableHighlight> */}
                    {
                        <TouchableOpacity 
                                onPress={()=>{this.push('InterHotel_compEditScreen',{
                                        passenger:data,
                                        customerInfo:customerInfo,
                                        // IsRewardPoint:roomModel.IsRewardPoint,
                                        IsRewardPointTVP:roomModel.IsRewardPoint && (roomModel.VendorCode==='TVP' || roomModel.SubChannel==='amadeus'),
                                        callBack: (reason,i,SerialNumber) => {
                                        if(i!=1){
                                            travellers&&travellers.map((item,indexx)=>{
                                                if(item.Name === reason.Name){
                                                    travellers[indexx] = reason
                                                }
                                            })
                                            this.setState({
                                                travPerson:reason,
                                            })
                                            // data = reason
                                            data.CertificateNumber=i
                                            data.CertificateType='身份证'
                                            data.CertificateId = 1
                                        }else{
                                            travellers&&travellers.map((item,indexx)=>{
                                                if(item.Name === reason.Name){
                                                    travellers[indexx] = reason
                                                }
                                            })
                                            this.setState({
                                                travPerson:reason,
                                            })
                                            data.CertificateNumber=SerialNumber
                                            data.CertificateType='身份证'
                                            data.CertificateId = 1
                                            // data = reason
                                        }
                                    }
                                }
                                )}} 
                                    style={{flexDirection:'row',width:screenWidth-115, alignItems: 'center',marginLeft:15}}>
                                <View style={{flexDirection:'column'}}> 
                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                        <CustomText text={'英文名' } />
                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                        <CustomText text={'：' } />
                                        <CustomText text={data.GivenName?data.GivenName:'请填写英文名'} style={{color:data.GivenName?'black':Theme.darkColor}} />
                                    </View> 
                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                        <CustomText text={'英文姓' } />
                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                        <CustomText text={'：' } />
                                        <CustomText text={data.Surname?data.Surname:'请填写英文姓'} style={{color:data.Surname?'black':Theme.darkColor}}/>
                                    </View>
                                </View> 
                                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                                </View>
                        </TouchableOpacity>
                    }                                
                </View>
            </View>
        )
    }
    _compAbloutLiveNumber = (data) => {
        if(!data){return}
        const { roomModel } = this.params;
        const { travellers,travPerson } = this.state;
        return (
            <View>
                {
                    data.map((obj, index) => {
                        return (
                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Theme.lineColor }}>
                                <TouchableHighlight onPress={this._deleteRoomLive.bind(this, data, index)} style={{ width: 35 }} underlayColor='transparent'>
                                    <AntDesign name={'delete'} size={22} color={Theme.theme} />
                                </TouchableHighlight>                                   
                                <CustomText text={obj.Name} />
                            </View>
                        )
                    })
                }
            </View>
        )
    }
    _renderBottomView = () => {
        // const { showPriceDetail ,travellers} = this.state;
        // if(!travellers){return}
        // let totalPrice = this.params.roomModel.AvgPrice * this.params.liveDay * travellers.length;
        const { showPriceDetail,ServiceFeesData,roomCount,travellers,customerInfo } = this.state;
        const {roomModel,liveDay} = this.params
        if(!ServiceFeesData || !travellers){return}
        let totalPrice = roomModel.AvgPrice * liveDay * roomCount;
        const beforTotal = totalPrice //记录不包含服务费的总价
        var serviceFee = 0;
        var VipServiceFee = 0;
        var servicePrice = 0;
        let vip = 0;
        let pub = 0;
        let needCreditCard = false;
        if(roomModel.NeedCreditCard){//信用卡模式用现付模式支付
            needCreditCard = true;
        }
        // var personList = [];
        // travellers.forEach(item => {
        //     item.map((obj)=>{
        //        personList.push(obj);
        //     })
        // })
        travellers.forEach((item)=>{
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        if(ServiceFeesData&&ServiceFeesData.ServiceFees&&ServiceFeesData.ServiceFees.length>0){
            ServiceFeesData.ServiceFees.map((item)=>{//非VIP
                if (item.FeeValueType == 1) {
                    serviceFee += Number(item.Price);
                }
                else if (item.FeeValueType == 2) {
                    item.Price = Number((item.FeeValue * roomModel.AvgPrice* liveDay).toFixed(2));
                    serviceFee += item.Price;
                }
            }) 
        }
       
        if(ServiceFeesData&&ServiceFeesData.VipServiceFees&&ServiceFeesData.VipServiceFees.length>0){
            ServiceFeesData.VipServiceFees.map((item)=>{//VIP
                if (item.FeeValueType == 1) {
                    VipServiceFee += Number(item.Price);
                }
                else if (item.FeeValueType == 2) {
                    item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                    VipServiceFee += item.Price;
                }
            }) 
        }
        
        if(ServiceFeesData.TollType===1){//按夜间收
            if(vip>0){
                servicePrice = VipServiceFee * liveDay * roomCount
            }else{
                servicePrice = serviceFee * liveDay * roomCount
            }
        }else if(ServiceFeesData.TollType===2){//按订单收取
            if(vip>0){
                servicePrice = VipServiceFee
            }else{
                servicePrice = serviceFee
            }
        }else if(ServiceFeesData.TollType===3){//按房间收取
            if(vip>0){
                servicePrice = VipServiceFee * roomCount
            }else{
                servicePrice = serviceFee * roomCount
            }
        }
        totalPrice =(ServiceFeesData&&ServiceFeesData.IsShowServiceFee || this.props.feeType===2)?Number((totalPrice+servicePrice).toFixed(2)):Number((totalPrice).toFixed(2)) 
       
        let serviceP = totalPrice - beforTotal //用包含服务费的总价 减去 不包含服务费的总价
        let price = roomModel.PaymentType === 1 || roomModel.NeedCreditCard ? 0 : beforTotal//前台现付总价传0
        let merchantPrice =ServiceFeesData?.IsShowServiceFee? MerchantPriceUtil.merchantPrice( CommonEnum.orderIdentification.intlHotel, customerInfo, price, serviceP,0,this.props.feeType,needCreditCard ) : 0
        totalPrice = totalPrice + merchantPrice

        return (
            <View style={{ height: 50, flexDirection: 'row', backgroundColor: 'white', alignItems: 'center',borderTopWidth:1 ,borderColor:Theme.lineColor}}>
                <CustomText style={{ marginLeft: 10, color: Theme.theme, fontSize: 17,fontWeight:'bold' }} text={totalPrice.toFixed(2)} />
                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableHighlight underlayColor='transparent' onPress={()=>{this._showPriceDetail(merchantPrice)}}>
                        <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end", alignItems: "center", height: 50 }}>
                            <CustomText style={{ fontSize: 13, color: 'gray' }} text='明细' />
                            <Ionicons name={showPriceDetail ? 'chevron-up' : 'chevron-down'} size={16} color={'gray'} style={{ marginRight: 5 }} />
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor='transparent' 
                           onPress={()=>{this._compOrderBtnClick(totalPrice)}}
                    >
                        <View style={styles.bottom_btn}>
                            <CustomText style={{ color: 'white' }} text='下一步' />
                        </View>
                    </TouchableHighlight>
                </View>
            </View >
        )
    }
}
const getStatePorps = state => ({
    feeType: state.feeType.feeType,
    apply: state.apply.apply,
    compCreate_bool: state.compCreate_bool.bool,
    comp_userInfo: state.comp_userInfo,
    comp_travelers: state.comp_travelers,
    compMassOrderId: state.compMassOrderId.massOrderId,
    shareAllArr: state.hotel_shareArr.shareAllArr
})
const mapDispatchToProps = dispatch =>({
    setHotelShareArr:(shareAllArr)=>dispatch(action.setHotelShareArr(shareAllArr)),
})
export default connect(getStatePorps,mapDispatchToProps)(IntelHotel_comp_CreateOrderScreen);


const styles = StyleSheet.create({
    titleText: {
        fontSize: 18,
        color: 'white'
    },
    headerView: {
        backgroundColor: Theme.theme,
        padding: 10
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
    row: {
        backgroundColor: 'white',
        height: 44,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginHorizontal:10,
        borderRadius:4,
        justifyContent:'space-between'
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
    }
})
