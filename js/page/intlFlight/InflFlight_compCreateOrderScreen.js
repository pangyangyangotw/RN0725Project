import React from 'react';
import {
    View,
    Platform,
    TouchableOpacity,
    StyleSheet,
    TouchableHighlight,
    Alert
} from 'react-native';
import SuperView from '../../super/SuperView';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Inf_CompPassnegerView from '../common/Inf_CompPassnegerView';
import ContactView from '../common/ContactView';
import DepartView from '../common/DepartView';
import AdditionInfoView from '../common/AdditionInfoView';
// import MailSelectView from '../common/MailSelectView';
import BackPress from '../../common/BackPress';
import UserInfoDao from '../../service/UserInfoDao';
import UserInfoUtil from '../../util/UserInfoUtil';
import CustomText from '../../custom/CustomText';
import ViewUtil from '../../util/ViewUtil';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Theme from '../../res/styles/Theme';
import { connect } from 'react-redux';
import CustomActioSheet from '../../custom/CustomActionSheet';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import I18nUtil from '../../util/I18nUtil';
import HeaderView from './HeaderView';
import PriceInfoView from './PriceInfoView';
import PolicyView from './PolicyView';
import PolicyView2 from './PolicyView2';
import InflFlightService from '../../service/InflFlightService';
import Util from '../../util/Util';
import Customer from '../../res/styles/Customer';
import CommonService from '../../service/CommonService';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AdCodeEnum from '../../enum/AdCodeEnum';
import AdContentInfoView from '../common/AdContentInfoView';
import OpenGetFile from '../../service/OpenGetFile';
import HighLight from '../../custom/HighLight';
import OpenGetPic from '../../service/OpenGetPic';
import MerchantPriceUtil from '../../util/MerchantPriceUtil';
import CommonEnum from '../../enum/CommonEnum';
import Utils from '../../util/Util';
import  LinearGradient from 'react-native-linear-gradient';
import {HighLight2,TitleView2} from '../../custom/HighLight';


class InflFlight_compCreateOrderScreen extends SuperView {
    constructor(props) {
        super(props);
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
        }
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: "white"
        }

        let options = ['护照','港澳通行证（含电子港澳通行证）', '台湾居民来往大陆通行证', '港澳居民来往内地通行证','大陆居民往来台湾通行证'];
        let optionNum = [];
        options.forEach((item,index)=>{
            if(Util.Read.certificateType2(item)){
                optionNum.push(Util.Read.certificateType2(item))
            }
        })

        this.backPress = new BackPress({ backPress: () => this._backBtnClick() })
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        const { order } = this.params || {};
        const { apply } = props;
        this.state = {

            order: order,
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
            // AdditionInfo: apply && apply.AdditionInfo ? {
            //     ...apply.AdditionInfo,
            //     DictItemList: apply.AdditionInfo.DictItemList ? apply.AdditionInfo.DictItemList : []
            // } : {
            //         DictItemList: []
            //     },
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

            // 广告
            adList: [],
            /**
             * 服务费数据
             */
             ServiceFeesData:[],

             fileList:[],

             nullDictList:[],

             PdfDictList:[],
             optionNum:optionNum
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

    _tipContent = () => {
        const { DepartureNationalCode, DestinationNationalCode, AirList } = this.state.order;
        let tipContent = '';
        let showTip = AirList.some((item => {
            return item.RouteType === 21;
        }))
        if (!showTip) {
            if (AirList.length > 1) {
                showTip = true;
                tipContent = I18nUtil.translate('若您未按照订单中的航班顺序乘坐，将自行承担航班无法登机的所有风险和责任；');
            }
        } else {
            tipContent = I18nUtil.translate('若您未按照订单中的航班顺序乘坐，将自行承担航班无法登机的所有风险和责任；');
        }
        if ((DepartureNationalCode === 'CN' && DestinationNationalCode === 'HK') || (DepartureNationalCode === 'HK' && DestinationNationalCode === 'CN')) {
            showTip = true;
            if (tipContent) {
                tipContent = tipContent + '\n' + I18nUtil.translate('大陆乘客来往香港，请使用港澳通行证；使用护照出行的乘客，须同时持有7天内前往第三国或地区的机票；');
            } else {
                tipContent = I18nUtil.translate('大陆乘客来往香港，请使用港澳通行证；使用护照出行的乘客，须同时持有7天内前往第三国或地区的机票；');
            }
        }
        if ((DepartureNationalCode === 'CN' && DestinationNationalCode === 'TW') || (DepartureNationalCode === 'TW' && DestinationNationalCode === 'CN')) {
            showTip = true;
            if (tipContent) {
                tipContent = tipContent + '\n' + I18nUtil.translate('大陆乘客来往台湾，证件类型请使用台湾通行证，如在台湾中转/经停，请选择护照并携带后续航班行程单；');
            } else {
                tipContent = I18nUtil.translate('大陆乘客来往台湾，证件类型请使用台湾通行证，如在台湾中转/经停，请选择护照并携带后续航班行程单；');
            }
        }
        this.setState({
            tipContent: tipContent,
            showTip: showTip
        })
    }
    //  自由搭配时多航段p价格
    _getMoreComboPrice = () => {
        const { order } = this.state;
        const journey = this.params?.journey;
        if (order.JourneyType === 2 && order.IsCustomTrip) {
            this.showLoadingView('多航段P价格');
            let model = {
                TicketingCarrier: journey?.TicketingCarrier || '',
                Journeys: [journey?.OWFlights, journey?.RTFlights]
            }
            InflFlightService.getMoreComboPrice2(model).then(response => {
                if (response && response.success && response.data) {
                    if (response.data[0].TotalPrice < order.TotalPrice) {
                        order.TotalPrice = response.data[0].TotalPrice;
                        order.BasePrice = response.data[0].BasePrice;
                        order.Tax = response.data[0].Tax;
                        this.setState({ order: order, showLoading: false }, () => {
                            // this.showAlertView(`我们为您选择的航班组合查询出更低价 ¥${order.TotalPrice}元`);
                            this.showAlertView(I18nUtil.tranlateInsert("我们为您选择的航班组合查询出更低价 ¥{{noun}}元", order.TotalPrice));
                        });
                    } else {
                        this.hideLoadingView();
                    }
                } else {
                    this.hideLoadingView();
                }
            }).catch(error => {
                this.hideLoadingView();
            });
        }
    }




    componentDidMount() {
        const { employees, Contact, ApproveOrigin, travellers,order,userInfo,AdditionInfo } = this.state;
        const {comp_userInfo,compCreate_bool,comp_travelers} = this.props;
        this._tipContent();
        this._getMoreComboPrice();
        this.backPress.componentDidMount();

        let _employees = comp_travelers&&comp_travelers.compEmployees;
        let _travellers = comp_travelers&&comp_travelers.compTraveler;
        if(compCreate_bool){
            _employees = comp_userInfo.employees;
            _travellers = comp_userInfo.travellers;
        }
        if((order.DepartureNationalCode == 'CN' || order.DestinationNationalCode == 'CN')&&((['HK','MO'].includes(order.DepartureNationalCode))||(['HK','MO'].includes(order.DestinationNationalCode)))){
            this._handlePriority(_employees,_travellers,1)
        }else
        if((order.DepartureNationalCode == 'CN' || order.DestinationNationalCode == 'CN')&&(order.DepartureNationalCode == 'TW' || order.DestinationNationalCode == 'TW')){
            this._handlePriority(_employees,_travellers,2)
        }else
        if(['MO','HK','TW'].includes((order.DepartureNationalCode)) && ['MO','HK','TW'].includes((order.DestinationNationalCode))){
            this._handlePriority(_employees,_travellers,4)
        }else{
            this._handlePriority(_employees,_travellers,3) 
        }

        this.setState({
            employees:_employees,
            travellers:_travellers,
        })

        this.showLoadingView();
        CommonService.getUserInfo().then(userInfoRes => {
            if (userInfoRes && userInfoRes.success && userInfoRes.data) {
                let userInfo = userInfoRes.data;
                // let user = UserInfoUtil.getUser(userInfo);
                if (this.props.apply) {
                    UserInfoUtil.ApplyEmployee(this.props.apply, employees);
                    UserInfoUtil.ApplyTravller(this.props.apply, travellers);
                } else {
                    // 添加用户
                    let user = UserInfoUtil.getUser(userInfo);
                    employees.push(user);
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
                    this.hideLoadingView();
                    if (response && response.success) {
                        let customerInfo = response.data;
                        this.state.actionSheetOptions = UserInfoUtil.DeliveryItems(customerInfo);
                        this.showLoadingView();
                        CommonService.CurrentDictList({
                            OrderCategory: 7,
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
                        this.toastMsg(response.message || '获取客户配置信息失败');
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message);
                })
            } else {
                this.hideLoadingView();
                this.toastMsg(userInfoRes.message);
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message);
        })
        CommonService.GetAdStrategyContent(AdCodeEnum.intlFlightOrder).then(response => {
            if (response && response.success) {
                this.setState({
                    adList: response.data
                })
            }
        }).catch(error => {

        })
        var nationalCodes = [order.DepartureNationalCode,order.DestinationNationalCode];
        //服务费
        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }
        let AirCodes = []
        order.AirList&&order.AirList.map((item)=>{
            item?
            AirCodes.push(item.AirlineCode)
            :null
        })
        let model={
            OrderCategory:7,
            MatchModel:{
                NationalCodes:JSON.stringify(nationalCodes),
                AirlineCode:AirCodes.join('/')
            },
            MassOrderId:this.props.compMassOrderId,
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
     * 计算服务费
     */
     _calcuPrice = (isShow) => {
        const { order, employees, travellers, mailSendInfo, customerInfo, ServiceFeesData } = this.state;
        if(!ServiceFeesData){return}
        let totalPrice = 0;
        totalPrice += (employees.length + travellers.length) * (order.BasePrice + order.Tax);
        var serviceFee = 0;
        var VipServiceFee = 0;
        var baseAmount = order.BasePrice + order.Tax;
        ServiceFeesData&&ServiceFeesData.ServiceFees&&ServiceFeesData.ServiceFees.map((item,index)=>{
            if (item.FeeValueType == 1) {
                serviceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * baseAmount).toFixed(2));
                serviceFee += item.Price;
            }
        }) 
        ServiceFeesData&&ServiceFeesData.VipServiceFees&&ServiceFeesData.VipServiceFees.map((item,index)=>{
            if (item.FeeValueType == 1) {
                VipServiceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * baseAmount).toFixed(2));
                VipServiceFee += item.Price;
            }
        })  

        if (ServiceFeesData.IsShowServiceFee) {
            employees.forEach(item => {
                if (item.IsVip) {
                    totalPrice += VipServiceFee;
                } else {
                    totalPrice += serviceFee;
                }
            })
            travellers.forEach(item => {
                if (item.IsVip) {
                    totalPrice += VipServiceFee;
                } else {
                    totalPrice += serviceFee;
                }
            })
        }
        if (mailSendInfo.sendType && mailSendInfo.sendType.MailingMethod != 1) {
            totalPrice += customerInfo.Setting.ExpressPrice;
        }

        let servicePrice = totalPrice - baseAmount //用包含服务费的总价 减去 不包含服务费的总价
        let merchantPrice =ServiceFeesData?.IsShowServiceFee ? MerchantPriceUtil.merchantPrice( CommonEnum.orderIdentification.intlFlight, customerInfo, baseAmount, servicePrice ) : 0
        let totalp = totalPrice + merchantPrice
        if(isShow){
            return merchantPrice//刷卡手续费
        }else{
            return totalp.toFixed(2)
        }
    }
    _actionAlertClick = () => {
        this.actionSheet.show();
    }
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
     * 查看明细
     */
    _showPriceDetail = () => {
        this.priceInfo.show();
    }
    /**
     *  查看退改规则
     */

    _showRules = (index) => {
        if(index===1){
            this.policyView.show(this.state.order);
        }else{
            this.policyView2.show(this.state.order);
        }
    }
    _orderBtnClick = () => {
        const { employees, travellers } = this.state;
        if (employees.length + travellers.length === 0) {
            this.toastMsg('请添加乘客');
            return;
        }
        if (employees.length + travellers.length > 9) {
            this.toastMsg('乘客最多为9人');
            return;
        }
        //合并employees, travellers两个数组
        let passengerList = [...employees, ...travellers];
        for (let index = 0; index < passengerList.length; index++) {
            const obj = passengerList[index];
            const errMsg = this._errorFailuer(obj, index);
            if (!errMsg) {
                continue;
            }
            if (errMsg === '证件有效期不正确') {
                this.toastMsg(errMsg);
                return;
            }
            if (obj.CertificateType == "护照" || obj.CertificateType == "Passport") {
                this.showAlertView("证件有效期不足半年", () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                    })
                })
                return;
            }
            this.showAlertView("证件有效期不足半年", () => {
                return ViewUtil.getAlertButton('取消', () => {
                    this.dismissAlertView();
                }, '继续预订', () => {
                    this.dismissAlertView();
                    this._orderBtnClick1();
                })
            })
            return;
        }
        this._orderBtnClick1();
    }
    
    _orderBtnClick1 = () => {
        const { employees, travellers, order, Contact, customerInfo, AdditionInfo, userInfo, ApproveOrigin, mailSendInfo, MaillingInfo,fileList,nullDictList } = this.state;
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
                let dicItem = AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item =>
                    // obj.NeedInput ? item.DictName === obj.Name : item.DictId === obj.Id
                    item.DictCode === obj.Code
                );
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
                if (dicItem?.ItemName && obj?.FormatRegexp) {
                    let regex;
                    try {
                        regex = new RegExp(obj.FormatRegexp);
                    } catch (e) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}格式校验规则异常', I18nUtil.translate(obj.Name)));
                        return;
                    }
                    try {
                        if (!regex.test(dicItem.ItemName)) {
                            this.toastMsg(obj?.Remark || I18nUtil.tranlateInsert('{{noun}}格式不符合规则', I18nUtil.translate(obj.Name)));
                            return;
                        }
                    } catch (e) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}格式校验规则异常', I18nUtil.translate(obj.Name)));
                        return;
                    }
                }
            }
        }
        let passengerList = [];
        let orderServiceCharge = 0;
        let nounNum = false;
        for (let index = 0; index < employees.length; index++) {
            const obj = employees[index];
            if(!(obj.CardTravel1&&obj.CardTravel1.length)>0){
                obj.CardTraveller=[]
            }
            let err = this._onValidate(obj, index);
            if (err) {
                this.toastMsg(err);
                return;
            }
            if (obj.IsVip) {
                orderServiceCharge += customerInfo.VipServiceCharge;
            } else {
                orderServiceCharge += customerInfo.ServiceCharge;
            }
            let addit = obj.Addition?obj.Addition:obj.AdditionInfo?obj.AdditionInfo:null
            const visibleEmployeeIdSet = getVisibleDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, addit && addit.DictItemList);
            customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.map((item)=>{
                if (!visibleEmployeeIdSet.has(item.Id)) {
                    return;
                }
                let dicItem = addit&&addit.DictItemList.find(dic => {
                    if (!dic) return false;
                    if (item.Code !== undefined && dic.DictCode == item.Code) return true;
                    return dic.DictId == item.Id;
                });
                if(dicItem&&(dicItem.IsRequire) && (!dicItem.ItemName) && (item.ShowInOrder)){
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', dicItem.DictName));
                    nounNum = true;
                    return;
                }
            })
            if(nounNum){
                return;
            }
            let additionList =obj.Addition ? obj.Addition : obj.AdditionInfo ? obj.AdditionInfo :null
            if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                const visibleIdSet = getVisibleDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, additionList && additionList.DictItemList);
                for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                    if (!visibleIdSet.has(customerInfo.EmployeeDictList[i].Id)) {
                        continue;
                    }
                    let itemIndex =  additionList.DictItemList&&additionList.DictItemList.find(item => {
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

            if(obj.CertificateType=='外国人永久居留身份证'|| obj.CertificateType=="Foreigner's Permanent Residence ID Card"){
                this.toastMsg('外国人永久居留身份证不能预订国际机票');
                return;
            }
            if(obj.Surname && obj.GivenName){
                if(Util.RegEx.isEnName(obj.Surname)){
                    this.toastMsg('英文姓必须是英文字符');
                    return;
                }
                if(Util.RegEx.isEnName(obj.GivenName)){
                    this.toastMsg('英文名必须是英文字符');
                    return;
                }
            }
            if(obj.LastName && obj.FirstName){
                if(Util.RegEx.isEnName(obj.LastName)){
                    this.toastMsg('英文姓必须是英文字符');
                    return;
                }
                if(Util.RegEx.isEnName(obj.FirstName)){
                    this.toastMsg('英文名必须是英文字符');
                    return;
                }
            }
            passengerList.push({
                Name: obj.Name,
                LastName: obj.LastName?obj.LastName:obj.Surname,
                FirstName: obj.FirstName?obj.FirstName:obj.GivenName,
                Sex: obj.Sex?obj.Sex:obj.Gender,
                Nationality: obj.NationalCode,
                NationalName: obj.NationalName,
                NationalCode: obj.NationalCode,
                Mobile: obj.Mobile,
                Email: obj.Email,
                AdditionInfo:additionList,
                Certificate: {
                    Type: Util.Read.certificateType2(obj.CertificateType),
                    Birthday: obj.Birthday,
                    SerialNumber: obj.CertificateNumber,
                    Expire: obj.CertificateExpire,
                    NationalName: obj.NationalName,
                    NationalCode: obj.NationalCode,
                    IssueNationCode: obj.NationalCode,
                    IssueNationName: obj.NationalName,
                    ImageUrl: obj.ImageUrl,
                    Sex: obj.Sex?obj.Sex:obj.Gender
                },
                PassengerType: 1,
                Birthday: obj.Birthday,
                GivenName: obj.GivenName,
                Surname: obj.Surname,
                FirstName: obj.GivenName,
                LastName: obj.Surname,
                DepartmentId: obj.DepartmentId,
                PassengerOrigin: obj.PassengerOrigin,
                CardTraveller:obj.CardTravel1&&obj.CardTravel1[0],
                IsVip: obj.IsVip,
                // Nationality: obj.Nationality,
                NationalityCode: obj.NationalityCode,
                Addition:obj.Addition?obj.Addition:obj.AdditionInfo?obj.AdditionInfo:null,
                // Addition:additionList,
            });
        }
        for (let index = 0; index < travellers.length; index++) {
            const obj = travellers[index];
            let err = this._onValidate(obj, index);
            if (err) {
                this.toastMsg(err);
                return;
            }
            if (obj.IsVip) {
                orderServiceCharge += customerInfo.VipServiceCharge;
            } else {
                orderServiceCharge += customerInfo.ServiceCharge;
            }
            let additionList = compCreate_bool ? obj.Addition : obj.AdditionInfo
            if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                const visibleIdSet = getVisibleDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, additionList && additionList.DictItemList);
                for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                    if (!visibleIdSet.has(customerInfo.EmployeeDictList[i].Id)) {
                        continue;
                    }
                    let itemIndex = additionList.DictItemList&&additionList.DictItemList.find(item => {
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
            if(obj.CertificateType=='外国人永久居留身份证'|| obj.CertificateType=="Foreigner's Permanent Residence ID Card"){
                this.toastMsg('外国人永久居留身份证不能预订国际机票');
                return;
            }
            if(obj.Surname && obj.GivenName){
                    if(Util.RegEx.isEnName(obj.Surname)){
                        this.toastMsg('英文姓必须是英文字符');
                        return;
                    }
                    if(Util.RegEx.isEnName(obj.GivenName)){
                        this.toastMsg('英文名必须是英文字符');
                        return;
                    }
            }
            passengerList.push({
                Name: obj.Name,
                Sex: obj.Sex,
                Nationality: obj.Nationality,
                Mobile: obj.Mobile,
                Email: obj.Email,
                Certificate: {
                    Type: Util.Read.certificateType2(obj.CertificateType),
                    SerialNumber: obj.CertificateNumber,
                    Expire: obj.CertificateExpire,
                    NationalName: obj.NationalName,
                    NationalCode: obj.NationalCode,
                    IssueNationCode: obj.IssueNationCode,
                    IssueNationName: obj.IssueNationName,
                    ImageUrl: obj.ImageUrl
                },
                IsVip: obj.IsVip,
                PassengerType: 1,
                Birthday: obj.Birthday,
                GivenName: obj.GivenName,
                Surname: obj.Surname,
                DepartmentId: obj.DepartmentId,
                PassengerOrigin: {
                    Type: obj.Id ? 2 : 0,
                    TravellerId: obj.Id
                },
                NationalName: obj.NationalName,
                NationalCode: obj.NationalCode,
                Addition:obj.Addition?obj.Addition:obj.AdditionInfo?obj.AdditionInfo:null,

            });
        }
        const setting = customerInfo.Setting;
        if(setting&&setting.AttachmentConfig&&setting.AttachmentConfig.IntlAirNecessary){
            if(fileList.length==0){
                this.toastMsg('未上传附件');
                return;
            }
        }
        let orderModel = Util.Encryption.clone(order);
        orderModel.AirList.forEach(item => {
            item.DepartureTime = item.DepartureTime && item.DepartureTime.format('yyyy-MM-dd HH:mm:ss', true);
            item.DestinationTime = item.DestinationTime && item.DestinationTime.format('yyyy-MM-dd HH:mm:ss', true);
        })

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
        const visibleCompanyIdSet = getVisibleDictIdSet(customerInfo && customerInfo.DictList, customerInfo && customerInfo.DictMapList, AdditionInfo && AdditionInfo.DictItemList);
        AdditionInfo.DictItemList = nullDictList2.filter((it) => {
            const dictId = it && (it.DictId || it.Id);
            if (!dictId) return false;
            if (!childIdSet.has(dictId)) return true;
            return visibleCompanyIdSet && visibleCompanyIdSet.has(dictId);
        })

        let otherInfo = {
            Platform: Platform.OS,
            Customer: this.state.customer,
            Contact: Contact,
            ApproveOrigin: ApproveOrigin,
            AdditionInfo: AdditionInfo,
            PassengerList: passengerList,
            PriceList: [{
                Price: orderModel.BasePrice,
                Tax: orderModel.Tax,
                PassengerType: 1,//成人
                PassengerCount: passengerList.length,
                PurchasePrice:orderModel.PriceList&&orderModel.PriceList[0]&&orderModel.PriceList[0].PurchasePrice,
                PurchaseTax:orderModel.PriceList&&orderModel.PriceList[0]&&orderModel.PriceList[0].PurchaseTax
            }],
            ServiceCharge: orderServiceCharge,
            MailingMethod: mailSendInfo.sendType ? mailSendInfo.sendType.MailingMethod : null,
            MailingInfo: MaillingInfo,
            FeeType: this.props.feeType,
        };
        orderModel.ApplyId = this.props.apply ? this.props.apply.Id : 0;
        // orderModel.ApplyId = global.currentTravelApply ? global.currentTravelApply.Id : 0;
        this.params.journey.RTFlights &&this.params.goRuleModelArr&&this.params.goRuleModelArr.length>0
        ?
        orderModel.RcReasonLst = this.params.goRuleModelArr.concat(this.params.backRuleModelArr)
        :
        orderModel.RcReasonLst = this.params.backRuleModelArr
        this.params.journey.RcReasonLst = orderModel.RcReasonLst 
        let AttachmentModel = {
            AttachmentItems:fileList
        }
        Object.assign(orderModel, otherInfo);
        let params = Object.assign({ 
                requestModel: orderModel, 
                from: 'intlFlight',
                AttachmentModel,
                totalPrice: this._calcuPrice(0),
                journey:this.params.journey ,
                goRuleModel: this.params.goRuleModel,
                backRuleModel:this.params.backRuleModel,
                passengerList:passengerList,
            }, this.state);
        if (this.props.feeType === 2) {
            this.push('IntlFlightOrderSure', params);
            return;
        }
        // this.getTravellerUpdateCheck(passengerList,params);
        this._toNextJudge(params);
    }
    getTravellerUpdateCheck(passengerList,params) {
        let model = {
            OrderCategory: 7,//国际机票
            Travellers: passengerList
        }
        let Travellerarr = []
        passengerList.forEach((item,index) => {
            let EnCertificate =I18nUtil.translate(Util.Read.typeTocertificate2(item?.Certificate?.Type));
            let EnNationality =I18nUtil.translate(item?.Certificate?.NationalName);
            Travellerarr.push(
                Util.Parse.isChinese()?
                "第"+(index+1)+'位'+'：'+item?.Name+'\n'+'证件类型：'+Util.Read.typeTocertificate2(item?.Certificate?.Type)+'\n'+"证件号码："+Utils.Read.simpleReplace(item?.Certificate?.SerialNumber)+'\n'+'国籍/地区：'+item?.Certificate?.NationalName+"\n\n"
                :
                (index+1)+'th'+'：'+item?.GivenName+'/'+item?.Surname+'\n'+'Certificate Type：'+EnCertificate+'\n'+'Certificate Number：'+Utils.Read.simpleReplace(item?.Certificate?.SerialNumber)+'\n'+'Nationality/Area：'+EnNationality+"\n\n"
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
        params.JourneyId = this.params.JourneyId
        this.push('IntlFlightOrderSure', params);
    }
    /**
     * 校验乘客信息
     */
    _errorFailuer = (passenger, index) => {
        const { order } = this.params
        let expire = Util.Date.toDate(passenger.CertificateExpire);
        if (!expire) {
            return '证件有效期不正确';
        }
        // 使用可选链操作符和空值校验
        const isValidFlightData = order?.AirList?.[0]?.DestinationTime;
        const fallbackDate = new Date(); // 当前时间作为兜底值
        let baseDate = isValidFlightData 
                        ? new Date(isValidFlightData)
                        : fallbackDate;
        // 添加日期有效性二次验证
        if (isNaN(baseDate.getTime())) {
            console.error('无效的航班时间:', isValidFlightData);
            baseDate = fallbackDate;
        }
        baseDate.setMonth(baseDate.getMonth() + 6);
        if (baseDate > expire) {
            return '证件有效期不足半年';
        }
    }
    /**
     * 乘客校验
     */
    _onValidate = (passenger, index) => {
        if (!passenger) {
            return I18nUtil.tranlateInsert('第{{noun}}位乘客的信息异常', index + 1);
        }
        if (!passenger.Name) {

            return I18nUtil.tranlateInsert('第{{noun}}位乘客的姓名未填', index + 1);
        }
        if (!passenger.Surname) {
            return I18nUtil.tranlateInsert('{{noun}}的英文姓未填', passenger.Name);
        }
        if (!passenger.GivenName) {
            return I18nUtil.tranlateInsert('{{noun}}的英文名未填', passenger.Name);
        }
        if (!passenger.Mobile) {
            return I18nUtil.tranlateInsert('{{noun}}的手机号未填', passenger.Name);
        }
        if (!passenger.NationalName) {
            return I18nUtil.tranlateInsert('{{noun}}的国籍/地区未填', passenger.Name);
        }
        // if (!passenger.IssueNationName||!passenger.IssueNationCode) {
        //     return I18nUtil.tranlateInsert('{{noun}}的证件签发国没填写', passenger.Name);
        // }
        if (!passenger.CertificateType) {
            return I18nUtil.tranlateInsert('{{noun}}的证件类型未选', passenger.Name);
        }
        if (!passenger.CertificateNumber) {
            return I18nUtil.tranlateInsert('{{noun}}的证件号码未填', passenger.Name);
        }
        if (!passenger.CertificateExpire) {
            return I18nUtil.tranlateInsert('{{noun}}的证件有效期未选', passenger.Name);
        }
        if (!passenger.Sex && !passenger.Gender && !passenger.SexDesc) {
            return I18nUtil.tranlateInsert('{{noun}}的性别未选', passenger.Name);
        }
        if (!passenger.Birthday) {
            return I18nUtil.tranlateInsert('{{noun}}的生日未填', passenger.Name);
        }
        return null;
    }
    _handleLevel = (data,obj) => {
        data.CertificateNumber = obj&&obj.SerialNumber;
        data.Expire = obj&&obj.Expire;
        data.CertificateExpire = obj&&obj.Expire;
        data.IssueNationName = obj&&obj.IssueNationName;
        data.IssueNationCode = obj&&obj.IssueNationCode;
        data.CertificateType = obj ? obj.TypeDesc : (Utils.Parse.isChinese() ? '护照' : 'Chinese ID Card');//默认为护照
        data.CertificateId = obj&&obj.Type
        return data
    }

    GangAoTypeCertifLevelTW = (str) => {
        let type = null
        if(str == 4){
            type = 1;
        }else {
            type = 100;
        }
        return type
    }
    GangAoTypeCertifLevelHK = (str) => {
        let type = null
        if(str == 2){
            type = 2;
        }else if(str == 128){
            type = 1;
        }
        else {
            type = 100;
        }
        return type
    }

    _handlePriority = (employees,travellers,index)=>{
        const {optionNum} = this.state
        employees.map((data)=>{
            let certType = null
                if( data.NationalCode === 'HK' ||  data.NationalCode === 'MO'){
                    certType = 128;
                }else if( data.NationalCode === 'TW'){
                    certType = 4;
                }
            let obj = {
                    TypeDesc:certType ? Util.Read.typeTocertificate2(certType):null,
                }
            if(!(data.Certificates&&data.Certificates.length>0)){
                //如果optionNum不包含data?.CertificateType，说明不是我们需要的证件类型，直接返回
                if(!optionNum.includes(Utils.Read.certificateType2(data?.CertificateType))){
                    data = this._handleLevel(data,obj)
                }
                return
            }
            data.Certificates.map((itemIdCar)=>{
                if(index===1){
                    if(itemIdCar.NationalCode === 'CN'){
                        itemIdCar.levelNum = Utils.Read.GangAoTypeCertifLevelCN(itemIdCar.Type)//大陆与港澳往来
                    }else if(itemIdCar.NationalCode === 'TW'){
                        itemIdCar.levelNum = this.GangAoTypeCertifLevelTW(itemIdCar.Type)//大陆与台湾往来
                    }
                    else{
                       itemIdCar.levelNum = Utils.Read.GangAoTypeCertifLevel(itemIdCar.Type)//大陆与港澳往来
                    }
                }else if(index===2){
                    if(itemIdCar.NationalCode === 'CN'){
                        itemIdCar.levelNum = Utils.Read.TWTypeCertifLevelCN(itemIdCar.Type)//大陆与台湾往来
                    }else if(itemIdCar.NationalCode === 'HK' ||  itemIdCar.NationalCode === 'MO'){
                        itemIdCar.levelNum = this.GangAoTypeCertifLevelHK(itemIdCar.Type)//大陆与台湾往来
                    }
                    else{
                        itemIdCar.levelNum = Utils.Read.TWTypeCertifLevel(itemIdCar.Type)//大陆与台湾往来
                    }
                }else if(index===3){
                    itemIdCar.levelNum = Utils.Read.ElTypeCertifLevel(itemIdCar.Type)//其他，优先护照
                }else if(index===4){
                    if(itemIdCar.NationalCode === 'CN'){
                        itemIdCar.levelNum = Utils.Read.GangAoTaTypeCertifLevelCN(itemIdCar.Type)
                    }else{
                        itemIdCar.levelNum = Utils.Read.GangAoTaTypeCertifLevel(itemIdCar.Type)
                    }
                }
            })
            let min = data.Certificates.reduce((prev, current) => (prev.levelNum < current.levelNum ? prev : current));//优先级数值越小，优先级越高，找到优先级最高的
            if(min.levelNum&&min.levelNum!=100){//如果优先证件等于100，说明没有符合优先级的证件，按原有展示
                data = this._handleLevel(data,min);
            }else{
                data = this._handleLevel(data,obj);
            }
        })
        travellers.map((data)=>{
            let certType = null
                if( data.NationalCode === 'HK' ||  data.NationalCode === 'MO'){
                    certType = 128;
                }else if( data.NationalCode === 'TW'){
                    certType = 4;
                }
            let obj = {
                    TypeDesc:certType ? Util.Read.typeTocertificate2(certType):null,
                }
            if(!(data.Certificates&&data.Certificates.length>0)){
                if(!optionNum.includes(Utils.Read.certificateType2(data?.CertificateType))){ 
                    data = this._handleLevel(data,obj)
                }
                return
            }
            data.Certificates.map((itemIdCar)=>{
                if(index===1){
                    itemIdCar.levelNum = Utils.Read.GangAoTypeCertifLevel(itemIdCar.Type)
                }else if(index===2){
                    itemIdCar.levelNum = Utils.Read.TWTypeCertifLevel(itemIdCar.Type) 
                }else if(index===3){
                    itemIdCar.levelNum = Utils.Read.ElTypeCertifLevel(itemIdCar.Type)
                }else if(index===4){
                    itemIdCar.levelNum = Utils.Read.GangAoTaTypeCertifLevel(itemIdCar.Type)
                }
            })
            let min = data.Certificates.reduce((prev, current) => (prev.levelNum < current.levelNum ? prev : current));//优先级数值越小，优先级越高，找到优先级最高的
            if(min.levelNum&&min.levelNum!=100){//如果优先证件等于100，说明没有符合优先级的证件，按原有展示
                data = this._handleLevel(data,min);
            }else{
                data = this._handleLevel(data,obj);
            }
        })
    }

    renderBody() {
        const { customerInfo, userInfo, mailSendInfo,AdditionInfo,ApproveOrigin,travellers, employees, actionSheetOptions, MaillingInfo, order,ServiceFeesData,fileList,PdfDictList } = this.state;
        const { goRuleModel,backRuleModel } = this.params
        const { AirList } = order;
        let backFlightData = { list: [] };
        let goFlightData = { list: [] };
        AirList.forEach(journey => {
            if (journey.RouteType === 22){
                backFlightData.list.push(journey);
            } else {
                goFlightData.list.push(journey);
            }
        });
        let ContainsNoChange = this.params.journey.ModifyPolicy&&this.params.journey.ModifyPolicy[0]&&this.params.journey.ModifyPolicy[0].ContainsNoChange
        let ContainsNoRefund = this.params.journey.ModifyPolicy&&this.params.journey.ModifyPolicy[0]&&this.params.journey.ModifyPolicy[0].ContainsNoRefund
        let ContainsNoChange_r = this.params.journey.ModifyPolicy&&this.params.journey.ModifyPolicy[1]&&this.params.journey.ModifyPolicy[1].ContainsNoChange
        let ContainsNoRefund_r = this.params.journey.ModifyPolicy&&this.params.journey.ModifyPolicy[1]&&this.params.journey.ModifyPolicy[1].ContainsNoRefund
        return (
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                <AdContentInfoView adList={this.state.adList} detail_ad={true}/>
                <KeyboardAwareScrollView keyboardShouldPersistTaps='always' style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {this._renderHeaderTip()}
                    <HeaderView order={order} showRules={(index)=>this._showRules(index)}  
                                goRuleModel={goRuleModel} 
                                backRuleModel={backRuleModel} 
                                otwThis={this}
                                ContainsNoChange={ContainsNoChange}
                                ContainsNoRefund={ContainsNoRefund}
                                ContainsNoChange_r={ContainsNoChange_r}
                                ContainsNoRefund_r={ContainsNoRefund_r}
                    />
                    <View style={{backgroundColor:'#fff',borderRadius:6,marginHorizontal:10,padding:10,marginTop:10}}>
                    <Inf_CompPassnegerView
                        userInfo={userInfo}
                        travellers={travellers}
                        employees={employees}
                        customerInfo={customerInfo}
                        backFlightData={backFlightData}
                        goFlightData={goFlightData}
                        DepartureNationalCode={order.DepartureNationalCode}
                        DestinationNationalCode={order.DestinationNationalCode}
                        from={'intlFlight'}
                        otwThis={this}
                    />
                    </View>
                    <AdditionInfoView
                        customerInfo={customerInfo}
                        userInfo={userInfo}
                        AdditionIfo={AdditionInfo}
                        ApproveOrigin={ApproveOrigin}
                        fromNo = {32}//国际机票 综合  BusinessCategory
                        PdfDictList={fileList&&fileList.length>0 ? PdfDictList :null}
                    />
                    {
                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.IntlAirContainsAttachment//判断上传附件是否展示
                        ?
                        <View style={{marginTop:10,backgroundColor:'#fff', paddingHorizontal: 20,marginHorizontal:10,paddingVertical:10,borderRadius:6,marginBottom:10}}>
                             <TouchableOpacity  style={{ flexDirection:'row',alignItems:'center', backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,justifyContent: "space-between",flexWrap:'wrap' }}
                                                onPress={()=>{this._selectFile()}}>
                                    {
                                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.IntlAirNecessary?
                                        <TitleView2 title={'上传附件'} required={true}></TitleView2>
                                        :
                                        <TitleView2 title={'上传附件'}></TitleView2>
                                    }
                                    {/* <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} style={{ marginLeft: 5 }} /> */}
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
                                <View style={{ flexDirection: 'row',flex:1, height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:4}}>
                                    <CustomText text={item.FileName} style={{flex:3}}></CustomText>                 
                                    <AntDesign name={'delete'} onPress={()=>{
                                        fileList.splice(index,1);
                                        this.setState({})
                                    }} size={22} color={Theme.theme} />
                                </View>  
                            )
                        })
                    }
                    {/* <MailSelectView mailSendInfo={mailSendInfo} MaillingInfo={MaillingInfo} customerInfo={customerInfo} callBack={this._actionAlertClick} feeType={this.props.feeType} /> */}
                </KeyboardAwareScrollView>
                {this._renderBottomView()}
                <CustomActioSheet ref={o => this.actionSheet = o} options={actionSheetOptions} onPress={this._handlePress} />
                <PriceInfoView
                    ref={o => this.priceInfo = o}
                    customerInfo={customerInfo}
                    travellers={travellers}
                    employees={employees}
                    order={order}
                    mailSendInfo={mailSendInfo}
                    ServiceFeesData={ServiceFeesData}
                    merchantPrice={this._calcuPrice(1)}
                />
                <PolicyView ref={o => this.policyView = o} order={order} type='createOrder' />
                <PolicyView2 ref={o => this.policyView2 = o} order={order} type='createOrder' />
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
                        orderCategory:CommonEnum.CategogryId.intlFlight,
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
    /**
     *  显示支付方式
     */
    _renderPayType = () => {
        const { customerInfo } = this.state;
        if (!customerInfo || !customerInfo.Setting) return null;
        return (
            <View style={{ marginTop: 10, backgroundColor: 'white', paddingHorizontal: 10, height: 44, flexDirection: 'row', alignItems: 'center' }}>
                <CustomText text='支付方式' style={{ flex: 3 }} />
                <CustomText text={customerInfo.Setting.IsIntlFlightPaymentOnline ? '在线支付' : customerInfo.SettleTypeDesc} style={{ flex: 7 }} />
            </View>
        )
    }

    /**
        * 头部提示
        */
    _renderHeaderTip = () => {
        if (this.state.showTip) {
            // let tipTxt = '若您未按照订单中的航班顺序乘坐，将自行承担航班无法登机的所有风险和责任';
            return (
                <View style={{ backgroundColor: '#FFFBD9', marginHorizontal: 10, flexDirection: 'row',padding:10, borderRadius:6 }}>
                    <EvilIcons name={'bell'} size={20} color={'#ff7a03'} />
                    <CustomText style={{ flex: 1, fontSize: 13, marginHorizontal: 5,color:Theme.theme }} numberOfLines={10} text={this.state.tipContent} />
                    <AntDesign name={'closecircle'} size={18} color={'rgba(0, 0, 0, 0.3)'} onPress={() => this.setState({ showTip: false })} />
                </View>
            );
        }
        return null;
    }

    _renderBottomView = () => {
        const { customerInfo, showPriceDetail } = this.state;
        return (
            <View style={{ height: 50, flexDirection: 'row', backgroundColor: 'white', alignItems: 'center' }}>
                <CustomText style={{ marginLeft: 10, color: Theme.theme, fontSize: 15 }} text={'¥' + this._calcuPrice(0)} />
                {
                    <CustomText style={{ color: 'gray', fontSize: 12 }} text='(含服务费)' />
                }
                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._showPriceDetail}>
                        <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end", alignItems: "center", height: 50 }}>
                            <CustomText style={{ fontSize: 12, color: 'gray' }} text='明细' />
                            <Ionicons name={showPriceDetail ? 'chevron-up' : 'chevron-down'} size={20} color={'gray'} style={{ marginRight: 5 }} />
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
}

const getStateProps = state => ({
    feeType: state.feeType.feeType,
    apply: state.apply.apply,
    comp_userInfo: state.comp_userInfo,
    compCreate_bool:state.compCreate_bool.bool,
    comp_travelers: state.comp_travelers,
    compMassOrderId: state.compMassOrderId.massOrderId,
})

export default connect(getStateProps)(InflFlight_compCreateOrderScreen);


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
    borderAll: {
        height: 25,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: "center",
        borderRadius: 3,
        paddingHorizontal:3
    }
})
