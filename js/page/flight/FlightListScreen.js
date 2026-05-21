import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    FlatList,
    SectionList,
    DeviceEventEmitter,
    TouchableHighlight,
    TouchableOpacity,
    Text
} from 'react-native';
import SuperView from '../../super/SuperView';
import I18nUtil from '../../util/I18nUtil';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import LowPriceView from './LowPriceView';
// import MorePriceView from './MorePriceView';
import FlightService from '../../service/FlightService';
import { connect } from 'react-redux';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import NetworkFaildView from '../../custom/NetWorkFaildView';
import TrainService from '../../service/TrainService';
import LisItemView from '../train/ListItemView';
import CommonService from '../../service/CommonService';
import UserInfoDao from '../../service/UserInfoDao';
import CommonEnum from "../../enum/CommonEnum";
import Pop from 'rn-global-modal';
import AntDesign from 'react-native-vector-icons/AntDesign';
import TrainlistView from '../train/TrainlistView';

const dcCodes = ['D', 'G', 'GD', 'C', 'XGZ'];
class FlightListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        let ShieldStops = this.params.customerInfo?.Setting?.FrontExtraConfig?.ShieldStops || false
        const initSelectCabin = this.params && this.params.selectCabin ? this.params.selectCabin : '不限';
        const initIsFilter = initSelectCabin !== '不限';
        this._navigationHeaderView = {
            title: this.params.isChange ? (I18nUtil.translate(this.params.DepartureCityName) + '-' + I18nUtil.translate(this.params.ArrivalCityName)) : I18nUtil.translate(this.params.goCityData.Name) + '-' + I18nUtil.translate(this.params.arrivalCityData.Name),
            rightButton: props.feeType === 1 ? ViewUtil.getRightImageButton(this._getTravelRuleAlert) : null

        },
            this._tabBarBottomView = {
                bottomInset: true,
                bottomColor: 'white'
            }
        this.state = {
            bottomBtnIndex: 0,
            sectionLists: [],
            showErrorMessage: '',
            recordSection: [],
            filterArr: [
                { title: '起飞时间', data: '不限' },
                { title: '出发机场', data: ['不限'] },
                { title: '到达机场', data: ['不限'] },
                { title: '航司', data: ['不限'] },
                // { title: '舱位', data: ['不限'] }
                { title: '机型', data: '不限' },
                { title: '舱位', data: initSelectCabin }
            ],
            isFilter: initIsFilter,
            isDirect: ShieldStops,
            isShare: true,
            currentLowPrice: 0,
            currentBusinessType: false, // 1和2表示机票还有火车票

            trainLowTrip: null,

            trainList: [],
            trainBottomIndex: 0,
            trainRecordList: [],
            isTrainFilter: false,
            trainFilterOptions: {
                FromStations: '不限',
                ToStations: '不限',
                TrainNewType:'不限',
                TrainGroup:'不限',
                FromTime:'不限',
                ToTime:'不限',
                TrainTicketType:'不限',
            },
            TermsAgreement: [],
            customer_info:{},
            user_info:{},
            trainLow:null,
            showTrain:true,
            selectCabin: initSelectCabin,
            craftTypeList: [],
        }
    }

    componentDidMount() {
        this._loadLowPrice();
        this.listener = DeviceEventEmitter.addListener(Key.FlightOrderCreateNotiList, () => {
            this.setState({ 
                sectionLists: [], 
                showErrorMessage: '', 
                trainList: [], 
                // trainLowTrip: null, 
                currentLowPrice: 0,
                trainLow:null,
            }, () => {
                this._loadLowPrice();
            });
        })
        this._loadInfo()
        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({ 
                craftTypeList : result || []
            });
        })
        this._loadRecommendedTrainQuery();//火车推荐接口
    }

    /**
     *  获取差旅标准
     */
    _getTravelRuleAlert = () => {
        const {ReferenceEmployee,compSwitch} = this.props;
        let modelStandar={
            OrderCategory:CommonEnum.orderIdentification.flight,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            RulesTravelId:ReferenceEmployee?.RulesTravelId,
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
                            //    ReferenceEmployee && JSON.stringify(ReferenceEmployee)!='{}' && ReferenceEmployee.RulesTravelDetails? 
                            //     (ReferenceEmployee.RulesTravelDetails&&ReferenceEmployee.RulesTravelDetails.map((obj)=>{
                            //         if(obj.Category===1 ){
                            //             return( 
                            //                 obj.Rules.map((item, index)=>{
                            //                     return(
                            //                     <View style={{flexDirection:'row',padding:2}} key={index}>
                            //                         <CustomText text={item.Key+': '+item.Value}/>
                            //                     </View>
                            //                     )
                            //                 })
                            //             )  
                            //         }
                            //     }))
                            //     :
                               (response.data.RuleDesc.map((item, index)=>{
                                return(
                                  <View style={{flexDirection:'row',padding:2}} key={index}>
                                     <CustomText text={item.Name+': '+item.Desc}/>
                                  </View>
                                )
                            }))    
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

    _loadInfo(){
        UserInfoDao.getUserInfo().then(user_info => {
            let referencEmployeeId
            if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
                let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
                referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
            }else{
                referencEmployeeId = user_info.Id
            }
            let model={
                ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                ReferencePassengerId:referencEmployeeId,
            }
            CommonService.customerInfo(model).then(response => {
                if (response && response.success && response.data) {    
                    this.setState({
                        customer_info:response.data,
                        user_info:user_info
                    })
                } 
            })
        })
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.listener && this.listener.remove();
    }

    _loadRecommendedTrainQuery(){
        const { isChange, arrivalCityData, goCityData, goDate, isSingle, oldModel } = this.params;
        if (isChange) return;
        let model = {
            DepartureCode: goCityData.Name,
            DestinationCode: arrivalCityData.Name,
            DepartureDate: goDate.format('yyyy-MM-dd', true),
            FeeType: this.props.feeType,
            IsReissueQuery: 0,
            OrderId:oldModel && oldModel.Id
        }
        // this.showLoadingView();
        TrainService.GetRecommendedTrainQuery(model).then(response => {
                // this.hideLoadingView();
                if(response.success && response.data){
                    this.setState({
                        trainLow:response.data
                    })
                }
        }).catch(error => {
            this.hideLoadingView();
        })
    }

    // 处理火车票业务
    _loadTrainLowPriceList() {        
        const { isChange, arrivalCityData, goCityData, goDate, isSingle, oldModel } = this.params;
        if (isChange) return;
        let model = {
            DepartureCode: goCityData.Name,
            DestinationCode: arrivalCityData.Name,
            DepartureDate: goDate.format('yyyy-MM-dd', true),
            FeeType: this.props.feeType,
            IsReissueQuery: 0,
            OrderId:oldModel && oldModel.Id
        }
        this.showLoadingView();
        TrainService.query(model).then(response => {
            this.hideLoadingView();
            if (response && Array.isArray(response)) {
                response.forEach(item => {
                    if (dcCodes.includes(item.train_type)) {
                        this.geTainMinPrice(item);
                        if (item.seatLowest) {
                            if (this.state.trainLowTrip) {
                                if (this.state.trainLowTrip.seatLowest.price > item.seatLowest.price) {
                                    this.state.trainLowTrip = item;
                                }
                            } else {
                                this.state.trainLowTrip = item;
                            }
                        }
                    }
                })
                this.setState({
                    trainList: response
                })
            } else {
            }
        }).catch(error => {
            if (this.state.currentBusinessType) {
                this.hideLoadingView();
            }
        })
    }

    geTainMinPrice(item) {
        let lowPrices = [];
        let check = item.IsCheckSeat == 1 && item.TrainSerat;
        if (dcCodes.includes(item.train_type)) {
            item.trainType = '高铁动车';
        } else {
            item.trainType = '普通列车';
        }
        const FlastTrain = ['G', 'GD', 'C', 'XGZ'];
        if (FlastTrain.includes(item.train_type)) {
            if (+item.dw_price > 0) {
                lowPrices.push({
                    seat: '动卧',
                    seatCount: !isNaN(item.dw_num) || item.dw_num ? (+item.dw_num) : 0,
                    price: +item.dwx_price,
                    checkSeat: check ? check.is_checkdw_num : 1
                })
            }
            if (+item.gjrw_price > 0) {
                lowPrices.push({
                    seat: '高级软卧',
                    seatCount: !isNaN(item.gjrw_num) || item.gjrw_num ? (+item.gjrw_num) : 0,
                    price: +item.gjrw_price,
                    checkSeat: check ? check.is_checkgjrw_num : 1
                });
            }
            if (+item.edz_price > 0) {
                lowPrices.push({
                    seat: '二等座',
                    seatCount: !isNaN(item.edz_num) || item.edz_num ? (+item.edz_num) : 0,
                    price: +item.edz_price,
                    checkSeat: check ? check.is_checkedz_num : 1
                });
            }
            if (+item.ydz_price > 0) {
                lowPrices.push({
                    seat: '一等座',
                    seatCount: !isNaN(item.ydz_num) || item.ydz_num ? (+item.ydz_num) : 0,
                    price: +item.ydz_price,
                    checkSeat: check ? check.is_checkydz_num : 1
                });
            }
            if (+item.edw_price > 0) {
                lowPrices.push({
                    seat: '二等卧',
                    seatCount: !isNaN(item.edw_num) || item.edw_num ? (+item.edw_num) : 0,
                    price: +item.edwx_price,
                    checkSeat: check ? check.is_checkedw_num : 1
                });
            }

            if (+item.ydw_price > 0) {
                lowPrices.push({
                    seat: '一等卧',
                    seatCount: !isNaN(item.ydw_num) || item.ydw_num ? (+item.ydw_num) : 0,
                    price: +item.ydwx_price,
                    checkSeat: check ? check.is_checkydw_num : 1
                });
            }
            if (+item.swz_price > 0) {
                lowPrices.push({
                    seat: '商务座',
                    seatCount: !isNaN(item.swz_num) || item.swz_num ? (+item.swz_num) : 0,
                    price: +item.swz_price,
                    checkSeat: check ? check.is_checkswz_num : 1
                });
            }
            if (+item.tdz_price > 0) {
                lowPrices.push({
                    seat: '特等座',
                    seatCount: !isNaN(item.tdz_num) || item.tdz_num ? (+item.tdz_num) : 0,
                    price: +item.tdz_price,
                    checkSeat: check ? check.is_checktdz_num : 1
                });
            }
            if (+item.yxydz_price > 0) {
                lowPrices.push({
                    seat: '优选一等座',
                    seatCount: !isNaN(item.yxydz_num) || item.yxydz_num ? (+item.yxydz_num) : 0,
                    price: +item.yxydz_price,
                    checkSeat: check ? check.is_checktdz_num : 1
                });
            }
        }
        if (lowPrices.length > 0) {
            let lowPrice = lowPrices[0];
            lowPrices.forEach(obj => {
                if (obj.price < lowPrice.price && obj.seatCount > 0) {
                    lowPrice = obj;
                }
            })
            item.seatLowest = {
                ...lowPrice
            }
        }
    }


    /** 
     * 舱位代码
     */
    _getCarbinCode = (data) => {
        let obj = this.state.filterArr.find(item => item.title === '舱位');
        switch (data || obj.data) {
            case '头等舱':
                return 'F';
            case '商务舱/公务舱':
                return 'C-J-F';
            case '超值经济舱':
                return 'W';
            case '经济舱':
                return 'Y';
        }
    }

    _filterCanbin = (data) => {
        const { craftTypeList } = this.state;
        let arr = [];
        data.forEach(item => {
            let journey = item.lowPrice[0];
            let isGoAir = false;
            let isArrivalAir = false;
            let isTime = false;
            let isAirLine = false;
            let isShare = true;
            let isFlightSize = false;
            this.state.filterArr.forEach(filter => {
                if (filter.title === '出发机场') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.DepartureAirportDesc) {
                            isGoAir = true;
                            break;
                        }
                    }
                }
                if (filter.title === '到达机场') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.ArrivalAirportDesc) {
                            isArrivalAir = true;
                            break;
                        }
                    }
                }
                if (filter.title === '航司') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.AirCodeDesc) {
                            isAirLine = true;
                            break;
                        }
                    }
                }
                if (filter.title === '起飞时间') {
                    if (filter.data === '不限') {
                        isTime = true;
                    } else {
                        const first = filter.data.split('-')[0].split(':')[0];
                        const last = filter.data.split('-')[1].split(':')[0];
                        const hours = Util.Date.toDate(journey.DepartureTime).getHours();
                        if (Number(first) <= hours && hours < Number(last)) {
                            isTime = true;
                        }
                    }
                }
                if (filter.title === '机型') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data;
                        if (obj === '不限' ||  obj === Util.Read.planType2(journey.AirEquipType,craftTypeList)) {
                            isFlightSize = true;
                            break;
                        }else if(obj === '其他机型'){
                            if(!(Util.Read.planType2(journey.AirEquipType,craftTypeList) === '大型' )){
                                isFlightSize = true;
                                break;
                            }
                        }
                    }
                }
            })
            if (!this.state.isShare) {
                if (journey.fltInfo && journey.fltInfo.codeShareLine) {
                    isShare = false;
                }
            }
            if (isGoAir && isArrivalAir && isTime && isAirLine && isShare && isFlightSize) {
                if (this.state.isDirect) {
                    if (!+journey.fltInfo.Stop) {
                        arr.push(item);
                    }
                } else {
                    arr.push(item);
                }
            }
        })
        if(!arr || arr.length==0){
            this.setState({
                showErrorMessage: '没有符合条件的航班了'
            })
        }
        this.setState({
            sectionLists: arr,
            recordSection: data
        }, () => {
            if (this.state.bottomBtnIndex == 2) {
                this._bottomSelectClick(2);
            }
        })
    }
    /**
     *  加载最低价
     */
    _loadLowPrice = () => {
        const { isChange, oldModel, DepartureDateTime, arrivalCityData, goCityData, goDate } = this.params;
        const { feeType, compReferenceEmployee,apply } = this.props;
        const { filterArr,selectCabin,isDirect } = this.state;
        let lowPricePromise = null;
        let journeyid = 0;
        if(apply){
            if(apply.TravelApplyMode==1 && apply.JourneyList && apply.JourneyList.length>0){
                //行程模式
                if(apply.selectApplyItem){
                    journeyid = apply.selectApplyItem&&apply.selectApplyItem.Id
                }else{
                    apply.JourneyList.forEach((item,index)=>{
                        if(item?.BusinessCategory & 1){
                           journeyid = item.Id
                        }
                    })
                }
            }else{
                //目的地模式
                journeyid = apply.Id
            }
        }
        if (isChange) {
            let model = {
                OrderId: oldModel && oldModel.Id,
                DepartureDate: DepartureDateTime.format('yyyy-MM-dd', true),
                RulesTravelId: compReferenceEmployee && compReferenceEmployee.RulesTravelId
            }
            lowPricePromise = FlightService.GetReissueQuery(model);
        } else {
            let canbin = selectCabin;
            if(this.state.isFilter){
                filterArr.map(item => {
                    if (item.title === '舱位') {
                        canbin = item.data;
                        this.setState({
                            selectCabin:item.data
                        })
                    }
                })
            }
            let model = {
                ArrivalAirport: arrivalCityData.Code,
                ArrivalCityName: arrivalCityData.Name,
                DepartureAirport: goCityData.Code,
                DepartureCityName: goCityData.Name,
                DepartureDateTime: goDate.format('yyyy-MM-dd', true),
                FeeType: feeType,
                ResBookDesigCode:this._getCarbinCode(canbin),
                ShowDiffrentSupplierPrice: true,
                RulesTravelId: compReferenceEmployee && compReferenceEmployee.RulesTravelId,
                ApplyId: apply?.Id || 0,
                JourneyId: journeyid
            }
            lowPricePromise = FlightService.GetFlightLowPrice(model);
        }
        if (!this.state.currentBusinessType) {
            this.showLoadingView();
        }
        this.showLoadingView();
        lowPricePromise.then(response => {
            if (!this.state.currentBusinessType) {
                this.hideLoadingView();
            }
            StorageUtil.saveKeyId(Key.FlightListStopTime, new Date().format('yyyy-MM-dd HH:mm:ss'))
            if (response && response.success) {
                if (!response.data || response.data.length === 0) {
                    this.setState({
                        showErrorMessage: '没有符合条件的航班了'
                    })
                    return;
                }
                if (response.data && response.data[0] && response.data[0].flightDisPlayInfo && response.data[0].flightDisPlayInfo[0] && response.data[0].flightDisPlayInfo[0].TermsAgreement) {
                    this.setState({
                        TermsAgreement: response.data[0].flightDisPlayInfo[0].TermsAgreement
                    })
                }
                let sectionList = [];

                response.data.forEach((obj, index) => {
                    if (obj.flightDisPlayInfo && Array.isArray(obj.flightDisPlayInfo) && obj.flightDisPlayInfo.length > 0) {
                        let playInfo = obj.flightDisPlayInfo[0];
                        if (index === 0) {
                            this.state.currentLowPrice = playInfo.Price;
                        }
                        if (this.state.currentLowPrice > playInfo.Price) {
                            this.state.currentLowPrice = playInfo.Price;
                        }
                        if (isChange) {
                            sectionList.push({ lowPrice: obj.flightDisPlayInfo, isOpen: false, data: [...obj.flightDisPlayInfo] });
                        } else {
                            sectionList.push({ lowPrice: obj.flightDisPlayInfo, isOpen: false, data: [] });
                        }
                    }
                })
                if (this.state.isFilter || isDirect) {
                    this._filterCanbin(sectionList);
                    return;
                }
                this.setState({
                    showErrorMessage: '',
                    recordSection: [].concat(sectionList),
                    sectionLists: sectionList
                }, () => {
                    StorageUtil.saveKeyId(Key.FlightListStopTime, new Date().format('yyyy-MM-dd HH:mm:ss'))
                    // if (this.state.bottomBtnIndex === 1) {
                    this._bottomSelectClick(this.state.bottomBtnIndex);
                    // }
                })
            } else {
                this.toastMsg(response.message || '获取数据失败请重试');
                this.setState({
                    showErrorMessage: response.message || '获取数据失败请重试'
                })
            }
        }).catch(error => {
            if (!this.state.currentBusinessType) {
                this.hideLoadingView();
            }
            if (error.message !== '网络超时，请检查您的网络' || error.message !== 'Network request failed') {
                this.toastMsg(error.message || '获取数据失败请重试');
            }
            this.setState({
                showErrorMessage: error.message || '获取数据失败请重试'
            })
        })
    }
    /**
     *  加载更多价格
     */
    _loadMorePrice = (section) => {
        const { isChange, ArrivalCityName,ArrivalCityCode,DepartureCityCode, arrivalCityData, DepartureCityName, goCityData, DepartureDateTime, goDate, arrivalDate } = this.params;
        const { TermsAgreement,user_info,customer_info,selectCabin,isDirect,isShare } = this.state;
        const { compReferenceEmployee, comp_userInfo } = this.props;
        let travellerCount = comp_userInfo.employees.length + comp_userInfo.travellers.length;
        let obj = section.lowPrice[section.lowPrice.length - 1];
        obj.fltInfo.cabinClassJson = obj.cabinClassInfo;
        let model = {
            AirCode: obj.AirCode,
            ArrivalAirport: obj.ArrivalAirport,
            ArrivalCityName: isChange ? ArrivalCityName : arrivalCityData.Name,
            ArrivalCityCode:isChange ? ArrivalCityCode : arrivalCityData.Code,
            DepartureAirport: obj.DepartureAirport,
            DepartureCityName: isChange ? DepartureCityName : goCityData.Name,
            DepartureCityCode:isChange ? DepartureCityCode : goCityData.Code,
            DepartureDateTime: isChange ? DepartureDateTime.format('yyyy-MM-dd', true) : goDate.format('yyyy-MM-dd', true),
            ArrivalDateTime:isChange ? '' : arrivalDate.format('yyyy-MM-dd', true),
            IsDirect: isDirect,
            IsShare: isShare,
            JourneyType: 'OW',
            LowestOrAll: 'A',
            MoreFlightJson: JSON.stringify([obj.fltInfo]),
            cabinClassJson: JSON.stringify(obj.cabinClassInfo),
            SupplierType: obj.SupplierType,
            SegHeadId: obj.ProductId,
            DataId: obj.DataId,
            FeeType: this.props.feeType,
            // RulesTravelId: compReferenceEmployee && compReferenceEmployee.RulesTravelId?compReferenceEmployee.RulesTravelId:user_info.RulesTravelId,
            RulesTravelId: compReferenceEmployee && compReferenceEmployee.RulesTravelId?compReferenceEmployee.RulesTravelId:null,
            SharedAirline: obj.fltInfo.codeShareLine,
            ResBookDesigCode:this._getCarbinCode(selectCabin)==="W"?"Y-W":this._getCarbinCode(selectCabin),
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            TravellerCount: travellerCount,
        }
        if(user_info?.Id === compReferenceEmployee?.Id){
            model.RulesTravelId =user_info.RulesTravelId;
        }
        if (isChange) {
            model.IsReissue = true;
        }
        this.push('FlightMorePrice', { 
             request: model, 
             ...this.params, 
             section: section, 
             feeType: this.props.feeType, 
             moreData: section.data, 
             TermsAgreement ,
             filterArr:this.state.filterArr,
             isFilter:this.state.isFilter,
             ResBookDesig: this.state.filterArr.find(item => item.title === '舱位'),
             RulesTravelId:compReferenceEmployee && compReferenceEmployee.RulesTravelId?compReferenceEmployee.RulesTravelId:user_info.RulesTravelId,
             customerInfo:customer_info,
             userInfo:user_info,
             selectCabin:this.state.selectCabin,
            });
    }
    /**
     *  加载更多数据之前，进行日期数据比较
     */

    _judgeIsLoadLow = (section) => {
        const { isChange } = this.params;
        StorageUtil.loadKeyId(Key.FlightListStopTime).then(response => {
            if (response && (new Date().getTime() - Util.Date.toDate(response).getTime() >= 10 * 60 * 1000)) {
                this.showAlertView('终于回来了，航班可能有变化，将为您重新查询', () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                        this.pop();

                    }, '确定', () => {
                        StorageUtil.saveKeyId(Key.FlightListStopTime, new Date().format('yyyy-MM-dd HH:mm:ss'))
                        this.setState({
                            sectionLists: [],                            
                        }, () => {
                            this.dismissAlertView();
                            this._loadLowPrice();
                        })
                    })
                })
            } else {
                this._loadMorePrice(section);
            }
        }).catch(error => {
            this._loadMorePrice(section);
        })
    }

    // 切换业务

    _checkBusinessType = (index) => {
        // 切换到火车不要了，改为跳转火车列表
        // const { trainList } = this.state;
        // // 如果trainList不存在或为空,加载火车低价列表
        // if (!trainList?.length) {
        //     this._loadTrainLowPriceList();
        // }
        // this.setState({
        //     currentBusinessType: index==2 ? true : false
        // })
        this.push('FlightTrainListScreen',{ 
            //把这个页面的this.params传过去
            ...this.params,
         });
    }

    /**
     *  修改日期 index=1是减 =2加
     */
    _changeDate = (index) => {
        if (index === 1) {
            let today = new Date();
            if (this.params.isChange) {
                if (today.format('yyyy-MM-dd') === this.params.DepartureDateTime.format('yyyy-MM-dd')) {
                    this.toastMsg('所选时间不能小于当前时间');
                    return;
                }
                this.params.DepartureDateTime = this.params.DepartureDateTime.addDays(-1);
            } else {
                if (today.format('yyyy-MM-dd') === this.params.goDate.format('yyyy-MM-dd')) {
                    this.toastMsg('所选时间不能小于当前时间');
                    return;
                }
                this.params.goDate = this.params.goDate.addDays(-1);
            }
        } else {
            if (this.params.isChange) {
                this.params.DepartureDateTime = this.params.DepartureDateTime.addDays(1);
            } else {
                this.params.goDate = this.params.goDate.addDays(1);
            }
        }
        this.setState({ sectionLists: [], showErrorMessage: '', trainList: [], trainLow: null, currentLowPrice: 0 }, () => {
            this._loadLowPrice();
            this._loadTrainLowPriceList();
        });
    }
    /**
     *  筛选 index 1,2,3
     */
    _bottomSelectClick = (index) => {
        this.setState({
            showErrorMessage: '',
        })
        switch (index) {
            case 1:

                this.state.sectionLists.sort((obj1, obj2) => {
                    let DepartureTime1 = obj1.lowPrice[0]['DepartureTime'];
                    let DepartureTime2 = obj2.lowPrice[0]['DepartureTime'];
                    return Util.Date.toDate(DepartureTime1) - Util.Date.toDate(DepartureTime2);
                })

                this.setState({
                    bottomBtnIndex: 1
                })
                break;
            case 2:
                this.state.sectionLists.sort((obj1, obj2) => {
                    let price1 = obj1.lowPrice[0]['Price'];
                    let price2 = obj2.lowPrice[0]['Price'];
                    return price1 - price2;
                })
                this.setState({
                    bottomBtnIndex: 2
                })
                break;
            case 3:
                this.push('FloghtCotidionScreen', {
                    refresh: (data, filter, isDirect, isFilter, isShare) => {
                        this.setState({
                            sectionLists: data,
                            filterArr: filter,
                            isDirect,
                            isShare,
                            isFilter,
                            showErrorMessage: data&&data.length > 0 ? '' : '没有符合条件的航班了'
                        }, () => {
                            this._bottomSelectClick(this.state.bottomBtnIndex);
                        })
                    }, 
                    load: (filter, isDirect, isFilter, isShare) => {
                        filter.map((item)=>{
                            if(item.title === '舱位'){
                                this.setState({
                                    selectCabin:item.data
                                })
                            }
                        })
                        this.setState({
                            sectionLists: [],
                            filterArr: filter,
                            isDirect,
                            isFilter,
                            isShare,
                        }, () => {
                            this._loadLowPrice();
                        })
                    },
                    data: [].concat(this.state.recordSection),
                    filter: this.state.filterArr,
                    isDirect: this.state.isDirect,
                    isShare: this.state.isShare,
                    canbinOption:this.params.canbinOption,
                    selectCabin:this.state.selectCabin,
                });
                break;
        }
    }
    /**
     *  点击刷新
     */
    _refreshPage = () => {
        this.setState({
            sectionLists: [],
            showErrorMessage: ''
        }, () => {
            this._loadLowPrice();
        })
    }

    // 预定最低价格火车票
    _toLowOrderTrain = () => {
        const { goCityData, arrivalCityData } = this.params;
        const { trainLowTrip } = this.state;
        if(!trainLowTrip){return}
        trainLowTrip.ticketTypes = [trainLowTrip.seatLowest];
        trainLowTrip.SearchFromCity = {
            fromCityName: goCityData.Name,
            fromCityCode: goCityData.Name
        }
        trainLowTrip.SearchToCity = {
            toCityName: arrivalCityData.Name,
            toCityCode: arrivalCityData.Name
        }
        this.push('TrainTicketScreen', {
            ticket: trainLowTrip,
            reissueOrder: null,
            departureDate: this.params.goDate,
            feeType: this.props.feeType
        })
    }



    /**
   *  点击预订按钮的操作
   */
    _orderBtnClick = (data) => {
        if (data && data.DepartureAirport === 'PKX') {
            this.showAlertView('大兴机场距离市区46公里，搭乘地铁到市区（草桥站）需约30分钟', () => {
                return ViewUtil.getAlertButton('确定', () => {
                    this.dismissAlertView();
                    this._getTravelRule(data);
                })
            })
        } else {
            this._getTravelRule(data);
        }

    }
    /**
    *  差旅规则鉴定
    */

    _getTravelRule = (data) => {
        const { isChange, isSingle, arrivalCityData, goCityData, arrivalDate,moreTravel } = this.params;
        const { compSwitch } = this.props;
        /** 
         * 改签
         */
        if (isChange) {
            this.push('FlightChangeDetail', Object.assign(this.params, { oldData: this.params.oldModel, newData: data }));
            return;
        }
        /**
         *  因私预订
         */

        let params = Util.Encryption.clone(this.params);
        if (!isSingle) {
            params = {
                goCityData: arrivalCityData,
                arrivalCityData: goCityData,
                goDate: arrivalDate,
                arrivalDate: arrivalDate,
                isSingle: isSingle,
                canbinOption:this.params.canbinOption,
                filterArr: Util.Encryption.clone(this.state.filterArr),
                isFilter: this.state.isFilter,
                isDirect: this.state.isDirect,
                isShare: this.state.isShare,
                ResBookDesig: Util.Encryption.clone(this.state.filterArr.find(item => item.title === '舱位')),
            }
        }
        params.goFlightData = data;
        if (this.props.feeType === 2) {
            if (!isSingle) {
                this.push('FlightRtList', params);
            } else {
                this.push('FlightOrderScreeb', params);
            }
            return;
        }
        let model = {
            DepartureCityName: data.DepartureCityName,
            DepartureCode: goCityData.Code,
            DestinationCityName: data.ArrivalCityName,
            DestinationCode: arrivalCityData.Code,
            DepartureTime: data.DepartureTime,
            DepAirport:data.ArrivalAirport,
            ArrAirport:data.DepartureAirport,
            Price: data.Price,
            Airline: data.AirCode,
            AirlineNumber: data.FlightNumber,
            AirPlace: data.ResBookDesigCode,
            Discount: data.DiscountRate,
            DataId: data.DataId,
            AirServiceCabin: data.AirServiceCabin,
            PriceId:data.PriceId,
            ShowLowerPrice:data.MorePriceTag?false:true,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId
        }
        this.showLoadingView('差旅规则检查');
        FlightService.MatchTravelRules(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data.unmatchlist && Array.isArray(response.data.unmatchlist) && response.data.unmatchlist.length > 0) {
                    for (const obj of response.data.unmatchlist) {
                        if (obj.IsEnable && obj.RuleType === 1 && obj.LowPriceFight) {
                            params.MatchTravelRules = response.data;
                            this.refs.lowPriceBottomView.showView(params);
                            return;
                        }
                    }
                    for (const obj of response.data.unmatchlist) {
                        if (obj.IsEnable && obj.Advanceday && obj.RuleType === 2) {
                            params.MatchTravelRules = response.data;
                            this.push('FlightRuleScreen', params);
                            break;
                        }
                        if (obj.IsEnable && obj.Discount && obj.RuleType === 7) {
                            params.MatchTravelRules = response.data;
                            this.push('FlightRuleScreen', params);
                            break;
                        }
                    }
                } else {
                    if (!isSingle) {
                        this.push('FlightRtList', params);
                    } else {
                        compSwitch ?
                            this.push('Flight_compCreatOrderScreen', params)
                            :
                            this.push('FlightOrderScreeb', params);
                    }
                }
            } else {
                if (response.code === "NoBooking4LowestPrice") {
                    params.bookLowestPrice = response.data;
                    this.refs.lowPriceView.showView(params);
                } else {
                    this.toastMsg(response.message || '差旅规则检测失败');
                }

            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '差旅规则检测失败')
        })

    }


    _renderHeaderDateSelect = () => {
        const { goDate, DepartureDateTime, isChange } = this.params;
        return (
            <View style={styles.headerView}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <AntDesign name={'left'} size={14} color={Theme.assistFontColor} />
                    <CustomText style={{fontSize:14, marginLeft:5}} onPress={this._changeDate.bind(this, 1)}
                        text='前一天'
                    />
                </View>
                <View style={styles.headerCenter}>
                    <CustomText style={{ color: Theme.theme}}
                        text={isChange ? DepartureDateTime.format('MM-dd') + ' ' + DepartureDateTime.getWeek() : goDate.format('MM-dd') + ' ' + goDate.getWeek()}
                    />
                </View>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <CustomText style={{fontSize:14, marginRight:5}} onPress={this._changeDate.bind(this, 2)}
                        text='后一天'
                    />
                    <AntDesign name={'right'} size={14} color={Theme.assistFontColor} />
                </View>
            </View>
        )
    }
    _renderLowPriceBusiness = () => {
        const { trainLowTrip,trainLow, currentLowPrice, currentBusinessType } = this.state;
        if (trainLow && this.params.isSingle && !this.params.isChange) {
            return (
                <View style={{ height: 54, backgroundColor: 'white', flexDirection: 'row' }}>
                    <TouchableHighlight underlayColor='transparent' style={{ flex: 1, }} onPress={this._checkBusinessType.bind(this, 1)}>
                        <View style={{ alignItems: 'center', height: 50, flex: 1, justifyContent: 'center', borderBottomColor: Theme.theme, borderBottomWidth: currentBusinessType === 1 ? 2 : 0 }}>
                            <CustomText text='飞机票' style={{fontSize:15}}/>
                            <View style={{ flexDirection: 'row', alignItems: 'center',padding:2 }}>
                                <CustomText text={`¥${currentLowPrice}`} style={{color:'gray'}}/>
                                <CustomText text='起' style={{color:'gray'}}/>
                            </View>

                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor='transparent' style={{ flex: 1, }} onPress={this._checkBusinessType.bind(this, 2)}>
                        <View style={{ alignItems: 'center', height: 54, flex: 1, justifyContent: 'center', borderBottomColor: Theme.theme, borderBottomWidth: currentBusinessType === 2 ? 2 : 0 }}>
                            <CustomText text='火车票' style={{fontSize:15}}/>
                           <View style={{ flexDirection: 'row', alignItems: 'center',padding:2 }}>
                            <CustomText text={`¥${trainLow.Price}`} style={{color:'gray'}}/>
                            <CustomText text='起' style={{color:'gray'}}/>
                            </View>
                        </View>
                    </TouchableHighlight>
                </View>
            )
        }
    }

    _renderBottomFilter = () => {
        const { bottomBtnIndex, isFilter } = this.state;
        return (
            <View style={styles.bottomView}>
                <TouchableOpacity underlayColor='transparent' onPress={this._bottomSelectClick.bind(this, 1)} style={styles.bottom_touch}>
                    <Image source={ bottomBtnIndex == 1 ? require('../../res/Uimage/flightFloder/time_circle.png'):require('../../res/Uimage/flightFloder/time_circle2.png')} style={{ width: 22, height: 22 }}></Image>
                    <CustomText style={{ color: bottomBtnIndex == 1 ? Theme.theme : 'gray',fontSize:11 }} text='从早到晚' />
                </TouchableOpacity>
                <TouchableOpacity underlayColor='transparent' onPress={this._bottomSelectClick.bind(this, 2)} style={styles.bottom_touch}>
                    <Image source={ bottomBtnIndex == 2  ? require('../../res/Uimage/flightFloder/_yuan2.png'):require('../../res/Uimage/flightFloder/_yuan.png')} style={{ width: 22, height: 22 }}></Image>
                    <CustomText style={{ color: bottomBtnIndex == 2 ? Theme.theme : 'gray',fontSize:11 }} text='价格排序' />
                </TouchableOpacity>
                <TouchableOpacity underlayColor='transparent' onPress={this._bottomSelectClick.bind(this, 3)} style={styles.bottom_touch}>
                    <Image source={ isFilter? require('../../res/Uimage/flightFloder/filter2.png'):require('../../res/Uimage/flightFloder/filter.png')} style={{ width: 22, height: 22 }}></Image>
                    <CustomText style={{ color: isFilter ? Theme.theme : 'gray',fontSize:11 }} text='筛选' />
                </TouchableOpacity>
            </View>
        )
    }

    _renderLowTrainDisplay = () => {
        const { trainLow,showTrain } = this.state;
        if(!trainLow || !showTrain){return};
        return (
            <TouchableOpacity underlayColor='transparent' onPress={this._checkBusinessType.bind(this, 2)}>
                <View style={{ marginHorizontal: 10, borderRadius: 6, backgroundColor: 'white',marginTop:8,justifyContent:'flex-end' }}>
                    <TouchableOpacity style={{flexDirection: 'row',justifyContent:'flex-end'}} 
                                      onPress={()=>{this.setState({showTrain:false})}}>
                       <Image source={require('../../res/Uimage/flightFloder/_close.png')} style={{ width: 18, height: 18,marginRight:0,justifyContent:'flex-end'}} />
                    </TouchableOpacity>
                    <View style={{flexDirection: 'row', alignItems: 'center',justifyContent:"space-between",paddingHorizontal:10,paddingBottom:18}}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Image source={require('../../res/Uimage/flightFloder/_OrangeTrain.png')} style={{ width: 30, height: 30 }} />
                            <CustomText style={{ marginLeft:15}} text={`${Util.Parse.isChinese()?trainLow.FromStationName: trainLow.FromStationCode} - ${Util.Parse.isChinese()?trainLow.ToStationName: trainLow.ToStationCode}`} />
                            <CustomText style={{ padding:5  }} text={trainLow.RunTime} />
                            <CustomText text={'('}></CustomText>
                            <CustomText text={trainLow.ZWName} />
                            <CustomText text={')'}></CustomText>
                        </View>
                        <CustomText style={{fontSize:16}} text={`¥${trainLow.Price}`} />
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    _renderSectionHeader = ({ section,index }) => {
        const { craftTypeList } = this.state;
        return <LowPriceView 
                  section={section} 
                  key={index} 
                  highRisk={this.props.highRisk} 
                  lowThis={this} 
                  currentLowPrice={this.state.currentLowPrice} 
                  loadMorePrice={this._judgeIsLoadLow.bind(this, section)} 
                  craftTypeList={craftTypeList}
                />
    }
   
    _renderItem = (item) => {
        return null;
        // return <MorePriceView priceObj={item}  {...this.params} feeType={this.props.feeType} moreThis={this} orderBtnClick={this._orderBtnClick.bind(this, item.item)} />
    }

    _renderError = () => {
        const { showErrorMessage } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {
                    showErrorMessage === '网络超时，请检查您的网络' || showErrorMessage === 'Network request failed' ?
                        <NetworkFaildView refresh={this._refreshPage} /> :
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <CustomText style={{ color: 'gray' }} text={showErrorMessage || '没有符合条件的航班了'} />
                        </View>
                }
            </View>
        )
    }

    renderBody() {
        const { sectionLists, showErrorMessage, trainList } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {this._renderHeaderDateSelect()}
                {/* {this._renderLowPriceBusiness()} */}
                {
                    !this.state.currentBusinessType ?
                        <View style={{ flex: 1 }}>
                            {
                                this._renderLowTrainDisplay()
                            }
                            {
                                sectionLists.length === 0 && showErrorMessage  ?
                                    this._renderError()
                                    :
                                    <SectionList
                                        renderSectionHeader={this._renderSectionHeader}
                                        sections={sectionLists}
                                        keyExtractor={(item, index) => `${item.id || item.key || index}`}
                                        initialNumToRender={8}
                                        maxToRenderPerBatch={5}
                                        updateCellsBatchingPeriod={50}
                                        windowSize={21}
                                        onEndReachedThreshold={0.5}
                                        showsVerticalScrollIndicator={false}
                                        stickySectionHeadersEnabled={false}
                                        removeClippedSubviews={false}
                                    />
                            }
                            {this._renderBottomFilter()}
                        </View>
                        :
                        <View style={{ flex: 1 }}>
                            <FlatList
                                style={{ flex: 1 }}
                                data={trainList}
                                showsVerticalScrollIndicator={false}
                                renderItem={this._renderTrainItem}
                                keyExtractor={(item, index) => String(index)}
                            />
                            {this._renderTrainBottom()}
                        </View>
                }
                <TrainlistView ref={o => this.priceView = o} />
            </View>
        )
    }
    /**
   * 行内容
   */
    _renderTrainItem = ({ item }) => {
        return (
            <LisItemView item={item} callBack={this._trainNextStation} trainlistCallBack={this._showDetail} filterOptions={this.state.trainFilterOptions} />
        )
    }
    _showDetail = (data,index) => {
        let departureDate =  this.params.goDate
        data.departureDate = departureDate.format('yyyy-MM-dd', true);
        this.priceView.show(data);
    }
    _renderTrainBottom = () => {
        let array = ['出发', '到达', '耗时', '筛选'];
        const { trainBottomIndex, isTrainFilter } = this.state;
        return (
            <View style={{ backgroundColor: "white", height: 50, flexDirection: 'row' }}>
                {
                    array.map((item, index) => {
                        return (
                            <TouchableOpacity key={index} onPress={this._renderTrainBottomFilter.bind(this, index)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                                <CustomText text={item} style={{ color: trainBottomIndex === index || (isTrainFilter && index === array.length - 1) ? Theme.theme : Theme.darkColor }} />
                                <Text style={{ color: trainBottomIndex === index || (isTrainFilter && index === array.length - 1) ? Theme.theme : Theme.darkColor }}>{index === 3 ? '' : '↓'}</Text>
                            </TouchableOpacity>
                        )
                    })
                }
            </View>
        )
    }
    /**
    *  筛选
    */
    _renderTrainBottomFilter = (index) => {
        let departureDate = this.params.goDate;
        switch (index) {
            case 0:
                this.state.trainList.sort((a, b) => {
                    let aDep = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd', true)} ${a.start_time}`);
                    let bDep = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd', true)} ${b.start_time}`);
                    return aDep - bDep;
                })
                break;

            case 1:
                this.state.trainList.sort((a, b) => {
                    let aDiff = departureDate.addDays(+a.arrive_days);
                    let bDiff = departureDate.addDays(+b.arrive_days);
                    let aDep = Util.Date.toDate(`${aDiff.format('yyyy-MM-dd', true)} ${a.arrive_time}`);
                    let bDep = Util.Date.toDate(`${bDiff.format('yyyy-MM-dd', true)} ${b.arrive_time}`);
                    return aDep - bDep;
                })
                break;
            case 2:
                this.state.trainList.sort((a, b) => {
                    return parseInt(a.run_time_minute) - parseInt(b.run_time_minute);
                })
                break;
            case 3:
                this.push('TrainFilterScreen', {
                    callBack: (isFilter, filterOptions) => {
                        this.setState({
                            isTrainFilter: isFilter,
                            trainFilterOptions: filterOptions
                        })
                    },
                    list: this.state.trainList,
                    filterOptions: this.state.trainFilterOptions
                });
                return;
        }

        this.setState({
            trainBottomIndex: index
        })
    }

    /**
     *  
     */
    _trainNextStation = (item) => {
        const { goCityData, arrivalCityData, goDate } = this.params
        item.SearchFromCity = {
            fromCityName: goCityData.Name,
            fromCityCode: goCityData.Name,
        }
        item.SearchToCity = {
            toCityName: arrivalCityData.Name,
            toCityCode: arrivalCityData.Name
        }
        let hasSeat = item.ticketTypes&&item.ticketTypes.some(ticket => ticket.seatCount > 0);
        if (hasSeat && item.can_buy_now === 'Y') {
            this.push('TrainTicketScreen', {
                ticket: item,
                reissueOrder: this.params.reissueOrder,
                departureDate: goDate,
                feeType: this.props.feeType
            })
        } else {
            if(item.can_buy_now==='N'){
                this.toastMsg('该车次车票未开售');
            }else{
                this.toastMsg('该车次车票已售完');
            }
        }
    }
}

const getPropsState = state => ({
    feeType: state.feeType.feeType,
    compSwitch: state.compSwitch.bool,
    compReferenceEmployee: state.compReferenceEmployee.ReferenceEmployee,//综合订单出差人选定参考出差人信息
    ReferenceEmployee: state.compReferenceEmployee.ReferenceEmployee,//综合订单出差人选定参考出差人信息
    highRisk:state.highRisk.highRisk,
    highRisk2:state.highRisk.highRisk2,
    comp_userInfo: state.comp_userInfo,
    customerInfo: state.customerInfo,
    apply: state.apply.apply,
})

export default connect(getPropsState)(FlightListScreen);

const styles = StyleSheet.create({
    headerView: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        justifyContent:'space-between',
        paddingHorizontal:10
    },
    headerText: {
        flex: 3,
        color: Theme.fontColor,
        textAlign: 'center'
    },
    headerCenter: {
        height: 20,
        backgroundColor: Theme.greenBg,
        // flex: 4,
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal:18
    },
    bottomView: {
        height: 62,
        backgroundColor: 'white',
        flexDirection: 'row',
        borderTopWidth:1,
        borderTopColor:Theme.greenBg
    },
    bottom_touch: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    alertStyle:{
        width: '80%', 
        backgroundColor:'#fff',
        borderRadius:8,
        padding:10,
        // height:125
        // marginTop:-250
    },
})
