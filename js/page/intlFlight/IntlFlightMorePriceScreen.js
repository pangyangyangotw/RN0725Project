import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    ActivityIndicator,
    FlatList,
    ScrollView,
    Image
} from 'react-native';
import SuperView from '../../super/SuperView';
import IntlFlightService from '../../service/InflFlightService';
import PolicyView from './PolicyView';
import PolicyView2 from './PolicyView2';
import RuleView2 from '../flight/RuleView2';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {connect} from 'react-redux'
import ViewUtil from '../../util/ViewUtil';
import CommonEnum from "../../enum/CommonEnum";
import Pop from 'rn-global-modal';
import CommonService from '../../service/CommonService';
import HTMLView from 'react-native-htmlview';
import ListRtBottomView from './ListRtBottomView';
import ListBottomView from './ListBottomView';
import CropImage from '../../custom/CropImage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';

/**
 * 国际机票更多价格列表页
 */
class MorePriceListScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            titleView: this._headerTitleView(),//单程更多价格
            rightButton: props.feeType === 1 ? ViewUtil.getRightImageButton(this._getTravelRuleAlert) : null
        }
        this._tabBarBottomView = {
            bottomInset:true
        }
        const { journey, queryModel, selectedJourney, isRt, isCustomerTab, select, newQueryModel,goRuleModel,goRuleModelArr,airPortData } = this.params;
        /**
         *  已选行程
         */
        this.selectedJourney = selectedJourney;
        /**
         * 是否是往返
         */
        this.isRt = isRt;
        /**
         * 是否是自由搭配
         */
        this.isCustomerTab = isCustomerTab;
        /**
         * 选择行程
         */
        this.select = select;
        /**
         * 状态
         */
        this.state = {
            journey: journey,
            moreLoading: true,
            queryModel: queryModel,
            newQueryModel: newQueryModel,
            morePriceList: [],
            goRuleModel:goRuleModel,
            goRuleModelArr:goRuleModelArr,
            isOnlyApply:false, //是否只允许申请单预定
            alertShow:false,
            itemData:null,
            showMore:false,
            showNoMoreCabinTip: false,
            lowPrices:[],
            craftTypeList:[],
            selectedIndex:0,//selectedIndex更多价行李默认选中第一个
            ItemIndex:0,

        };
    }

    /**
     *  获取差旅标准
     */
    _getTravelRuleAlert = () => {
        const {ReferenceEmployee} = this.props;
        let modelStandar={
            OrderCategory:CommonEnum.orderIdentification.intlFlight,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            RulesTravelId:ReferenceEmployee?.RulesTravelId,
        }
        this.showLoadingView();
        CommonService.GetTravelStandards(modelStandar).then(response => {
            this.hideLoadingView();
            if (response?.data?.RuleDesc?.length > 0) {
                Pop.show(
                    <View style={curStyle.alertStyle}>
                       <View style={{alignItems:'center',justifyContent:'center'}}>
                           <CustomText text={'温馨提示'} style={{margin:6,fontSize:18, fontWeight:'bold'}} />
                       </View>
                       <View style={{width:'80%'}}>
                           <CustomText text={response.data.OrderCategoryDesc} style={{padding:2,fontSize:14,fontWeight:'bold'}}/>
                           {  
                            //    ReferenceEmployee && JSON.stringify(ReferenceEmployee)!='{}' && ReferenceEmployee.RulesTravelDetails? 
                            //     (ReferenceEmployee.RulesTravelDetails&&ReferenceEmployee.RulesTravelDetails.map((obj)=>{
                            //         if(obj.Category===1){
                            //         return( 
                            //             obj.Rules.map((item, index)=>{
                            //                 return(
                            //                 <View style={{flexDirection:'row',padding:2}} key={index}>
                            //                     <CustomText text={item.Key+': '+item.Value}/>
                            //                 </View>
                            //                 )
                            //             })
                            //         )  
                            //         }
                            //     }))
                            //    :
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
                this.showAlertView('国际机票:不限');
            } 
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    /**
   *  标题
   */
    _headerTitleView = () => {
        const journey = this.params?.journey;
        if (journey?.OWFlights) {
            const flight = Array.isArray(journey.OWFlights) ? journey.OWFlights[0] : journey.OWFlights;
            if (!flight) {
                return null;
            }
            return (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CustomText text={flight.DepartureCityName} style={curStyle.titleText} />
                    <CustomText text={'-'} style={curStyle.titleText} />
                    <CustomText text={flight.ArrivalCityName} style={curStyle.titleText} />
                </View>
            )
        }
        return null;
    }


    componentDidMount() {
        const{ customerInfo_userInfo,apply,compReferenceEmployee} = this.props;
        let model = {
            ReferenceEmployeeId: this.props.comp_userInfo?.ReferenceEmployeeId || 0,
            ReferencePassengerId: this.props.comp_userInfo?.referencPassengerId || null,
        };
        CommonService.customerInfo(model).then(response => {
            if (response?.success && response.data) {
                const isApply = response.data?.Setting?.FlightTravelApplyConfig;
                if (isApply && isApply.IsAllCategory && isApply.IsOnlyApply && !customerInfo_userInfo?.userInfo?.NoNeedApply && !apply) {
                    this.setState({ isOnlyApply: true });
                }
            }
        });
        
        if(compReferenceEmployee?.Id == customerInfo_userInfo?.userInfo?.Id){
            this.state.newQueryModel.RulesTravelId = customerInfo_userInfo?.userInfo?.RulesTravelId;
        }else{
            this.state.newQueryModel.RulesTravelId = compReferenceEmployee?.RulesTravelId;
        }
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
        this.state.newQueryModel.JourneyId = journeyid;
        this.state.newQueryModel.ApplyId = apply?.Id || 0;
        this.state.newQueryModel.LowestPrcieCityStr = this.state.journey.LowestPrcieCityStr
        IntlFlightService.getIntlFlightQuery(this.state.newQueryModel).then(response => {
            if (response && Array.isArray(response)) {
                let priceArr =  response.sort(function(a,b){//价格排序
                    return a.TotalPrice - b.TotalPrice
                })
                let lowFarePrice = null;//最低协议价
                let _lowPrice = null;//最低价
                response.forEach(item => {
                    if (item.PriceList&&item.PriceList[0]&&item.PriceList[0].IsNegotiatedFare) {
                        if (!lowFarePrice) {
                            lowFarePrice = item;
                        } else {
                            if (lowFarePrice.TotalPrice> item.TotalPrice) {
                                lowFarePrice = item;
                            }
                        }
                    }
                    if (!_lowPrice) {
                        _lowPrice = item;
                    } else {
                        if (_lowPrice.TotalPrice > item.TotalPrice) {
                            _lowPrice = item;
                        }
                    }
                })
                if( lowFarePrice && (_lowPrice.TotalPrice < lowFarePrice.TotalPrice) ){
                    this.state.lowPrices = [_lowPrice,lowFarePrice];
                }else{
                    this.state.lowPrices = [_lowPrice];
                }
                if (Array.isArray(priceArr) && Array.isArray(this.state.lowPrices)) {
                    priceArr.forEach(obj => {
                        if (!obj) return; // 防止obj为null或undefined导致崩溃
                        this.state.lowPrices.forEach(item => {
                            if (!item) return; // 防止item为null或undefined导致崩溃
                            if (obj.TotalPrice === item.TotalPrice) {//如果PriceId相同就从priceArr中删除
                                let index = priceArr.findIndex(o => o && o.PriceId === item.PriceId);
                                if (index !== -1) {
                                    priceArr.splice(index, 1);
                                }
                            }
                        });
                    });
                }
                let morePriceList = this.state.lowPrices.concat(priceArr);

                this.setState({ moreLoading: false, morePriceList: morePriceList });

            } else {
                this.toastMsg(response.message || '没有可用舱位，请选择其他舱位');
                this.setState({ moreLoading: false });
            }
        }).catch(error => {
            this.toastMsg(error.message || '获取更多价格异常');
            this.setState({ moreLoading: false });
        })
        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({
                craftTypeList: result || [],
            })
        })
    }
    /**
     * 显示规则
     */
    _showModifyPolicy = (journey, isJump, index) => {
        // if (journey.IntlFlightRules) {
        //     this.refs.policy.show(journey);
        //     return;
        // }
        let model = [];
        let price = journey.PriceList[0];
        if (journey.Journeys.length === 1) {

            model.push({
                DepartureDate: journey.Journeys[0].FlightSegments[0].DepartureTime,
                DepartAirportCode: price.DepartureAirport,
                ArrivalAirportCode: price.ArrivalAirport,
                FilingAirlineCode: price.FilingAirline,
                FareReference: price.FareBasisCode,
                RefOne: price.Ref1,
                RefTwo: price.Ref2
            })
        }
        else if (journey.Journeys.length === 2) {
            model.push({
                DepartureDate: journey.Journeys[0].FlightSegments[0].DepartureTime,
                DepartAirportCode: price.DepartureAirport,
                ArrivalAirportCode: price.ArrivalAirport,
                FilingAirlineCode: price.FilingAirline,
                FareReference: price.FareBasisCode,
                RefOne: price.Ref1,
                RefTwo: price.Ref2
            })
        }
        this.showLoadingView();
        IntlFlightService.getIntlFlightRules(model).then(reponse => {
            this.hideLoadingView();
            if (reponse) {
                journey.IntlFlightRules = reponse.data;
                journey.ModifyPolicy = reponse.data;
                if (isJump) {
                     this.setState({

                     },()=>{
                        this._getTravelRule(journey);
                     })
                } else {
                    if(index===1){
                        this.refs.policy.show(journey);
                    }else{
                        this.refs.policy2.show(journey);
                    }
                }
            }
        }).catch(error => {
            this.toastMsg(error.message || '获取数据失败');
            this.hideLoadingView();
        })
    }

    /**
     * 获取退改规则
     */
    _getModifyPolicy = (journey) => {
        return new Promise((resolve, reject) => {
            if (journey.ModifyPolicy) {
                resolve();
            } else {
                if (journey.loadingPolicy) {
                    reject({ message: '正在加载中' });
                }
                const { queryModel } = this.state;
                let customerJson = queryModel.CustomerInfoJson;
                if (journey.SPFareInfoExt && Array.isArray(journey.SPFareInfoExt.AvJourneyRules)) {
                    let queryPolicyModel = journey.SPFareInfoExt.AvJourneyRules.map(rule => ({
                        AirportCode: rule.DepartureAirport,
                        FareReference: rule.FareReference,
                        FilingAirlineCode: rule.FilingAirline,
                        DepartAirportCode: rule.DepartureAirport,
                        ArrivalAirportCode: rule.ArrivalAirport,
                        RefOne: rule.RefOne,
                        RefTwo: rule.RefTwo,
                        CustomerInfoJson: customerJson
                    }));
                    if (queryPolicyModel.length > 0) {
                        queryPolicyModel[0].DepartureDate = journey.OWFlights.Flights[0].DepartureDate + 'T' + journey.OWFlights.Flights[0].DepartureTime + ':00';
                        queryPolicyModel[0].RequestedTicketingDate = queryPolicyModel[0].DepartureDate;
                        // if (!queryPolicyModel[0].AirportCode) {
                        //     queryPolicyModel[0].AirportCode = queryModel.OriCode;
                        // }
                    }
                    if (queryPolicyModel.length == 2) {
                        queryPolicyModel[1].DepartureDate = journey.RTFlights.Flights[0].DepartureDate + 'T' + journey.RTFlights.Flights[0].DepartureTime + ':00';
                        queryPolicyModel[1].RequestedTicketingDate = queryPolicyModel[1].DepartureDate;
                        // if (!queryPolicyModel[1].AirportCode) {
                        //     queryPolicyModel[1].AirportCode = queryModel.DesCode;
                        // }
                    }
                    journey.loadingPolicy = true;
                    this.showLoadingView('获取退改规则中');
                    IntlFlightService.getPolicy({ AirFareRuleJson: JSON.stringify(queryPolicyModel) }).then(response => {
                        this.hideLoadingView();
                        journey.loadingPolicy = false;
                        if (response && response.success && response.data) {
                            try {
                                var result = JSON.parse(response.data);
                                if (result && result.result == 1 && Array.isArray(result.data)) {
                                    let convertRules = result.data.map(item => {
                                        var curRule = item.Response.OTA_AirRulesRS.TSK_Extensions;
                                        if (curRule) {
                                            curRule.Intro = curRule.ResultData;
                                            if (curRule.RuleSimplifieds) {
                                                curRule.Rules = curRule.RuleSimplifieds.RuleSimplified;
                                            }
                                            return curRule;
                                        }
                                        return false;
                                    });
                                    journey.ModifyPolicy = convertRules;
                                    resolve();
                                } else {
                                    reject({ message: '解析退改规则异常' });
                                }
                            } catch (error) {
                                reject(error);
                            }
                        } else {
                            reject(error);
                        }
                    }).catch(error => {
                        this.hideLoadingView();
                        journey.loadingPolicy = false;
                        reject(error);
                    });
                } else {
                    reject({ message: '航班共享信息异常' });
                }
            }
        });
    }

    /**
     * 预订
     */
    _btnReserve = (journey) => {
        let _hightRist = this.isRt ? this.props.highRisk2 : this.props.highRisk
        if (_hightRist && _hightRist.Level ==1 ) {
            this.setState({
                alertShow:true,
                itemData:journey,
            })
            return;
        } 
        if(_hightRist && _hightRist.Level == 2){
            this.toastMsg('高危区域，不能预订');
            return;
        }
        if (!journey.EnableBook && this.props.feeType === 1) {
            this.toastMsg(journey.BlockBookingReason||'不符合您的差标规则，禁止预订');
            return;
        }
        this._showModifyPolicy(journey,1)
    }

    _getTravelRule = (journey,lowPrice) => {
        const { queryModel,goRuleModel,goRuleModelArr } = this.state;
        let params = Util.Encryption.clone(this.params);
        params.journey = journey
        params.goRuleModel = goRuleModel
        params.goRuleModelArr = goRuleModelArr
        params.JourneyId = this.params.JourneyId
        params.ViolationRules = journey.ViolationRules
        let flithtDepartureTime = (journey.RTFlights&&journey.RTFlights.FlightSegments)?
           journey.RTFlights?.FlightSegments?.[0].DepartureTime:
           journey.OWFlights?.FlightSegments?.[0].DepartureTime
        let model = {
            IntlFlightInfo:journey,
            RulesTravelId:queryModel.RulesTravelId,
            DepartureTime:flithtDepartureTime,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            IsOnlyDirect:params.filterOptions&&params.filterOptions.isDirect,
            IsRecommendFlight:lowPrice ? true : false,
        }
        this.showLoadingView('差旅规则检查');
        IntlFlightService.MatchTravelRules(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data.unmatchlist && response.data.unmatchlist.length > 0) {
                    for (const obj of response.data.unmatchlist) {
                        if (obj.IsEnable && obj.RuleType === 1 && obj.LowPriceFights?.length > 0 && !lowPrice) {
                                params.MatchTravelRules = response.data;
                                params.LowPriceFights = obj.LowPriceFights;
                                if(this.isRt){
                                    this.refs.lowPriceRtBottomView.showView(params);
                                }else{
                                    this.refs.lowPriceBottomView.showView(params); 
                                }                                
                                return;
                            // params.MatchTravelRules = response.data;
                            // this.push('IntFlightRtRuleScreen', params);
                            // break;
                        }
                    }
                    for (const obj of response.data.unmatchlist) {
                       // 删除RuleType值和journey.ViolationRules数组中RuleType不相同的元素
                        response.data.unmatchlist = response.data.unmatchlist.filter(obj => 
                            journey.ViolationRules.some(rule => rule.RuleType === obj.RuleType)
                        );
                        if(response.data.unmatchlist && Array.isArray(response.data.unmatchlist) && response.data.unmatchlist.length>0){
                            if (obj.IsEnable && obj.Advanceday && obj.RuleType === 2) {
                                params.MatchTravelRules = response.data;
                                this.push('IntFlightRtRuleScreen', params);
                                break;
                            }
                            if (obj.IsEnable && obj.Discount && obj.RuleType === 7) {
                                params.MatchTravelRules = response.data;
                                this.push('IntFlightRtRuleScreen', params);
                                break;
                            }
                            if (obj.IsEnable && obj.RuleType === 1 && Array.isArray(obj.LowPriceFights) && obj.LowPriceFights?.length > 0) {
                                params.MatchTravelRules = response.data;
                                this.push('IntFlightRtRuleScreen', params);
                                break;
                            }
                            if (obj.IsEnable && obj.RuleType === 3) {
                                params.MatchTravelRules = response.data;
                                this.push('IntFlightRtRuleScreen', params);
                                break;
                            }
                        }else{
                            this._convertToOrder(journey);
                        }
                    }
                }else{
                    this._convertToOrder(journey);
                }
            }else{
                this.toastMsg(response.message || '差旅规则检测失败')
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '差旅规则检测失败')
        })
    }   

    /**
     * 转换为订单model
     */
    _convertToOrder = (journey) => {
        
        const { queryModel } = this.state;
        const { compSwitch } = this.props;
        if (!journey) {
            return;
        }
        this.order = {
            DepartureNationalCode: queryModel.DepartureNationalCode,
            DestinationNationalCode: queryModel.DestinationNationalCode,
            Departure: journey.OWFlights.DepartureCityName,  //journey.OWFlights.departurnName,
            DepartureCode: journey.OWFlights.DepartureCityCode,
            Destination: journey.OWFlights.ArrivalCityName,//journey.OWFlights.arrivalName,
            DestinationCode: journey.OWFlights.ArrivalAirport,
            JourneyType: this.isRt ? 2 : 1,//1:单程，2:往返
            IsCustomTrip: this.isCustomerTab,
            AirList: [],
            BasePrice: journey.BasePrice,
            Tax: journey.Tax,
            SettlementPrice: journey.SettlementPrice,
            TotalPrice: journey.TotalPrice,
            TicketingCarrier: journey.TicketingCarrier,
            PriceList:journey.PriceList,
        };
        this._processFlights(journey.OWFlights, journey.RTFlights ? 21 : 1, journey.IntlFlightRules, 0);
        this._processFlights(journey.RTFlights, 22, journey.IntlFlightRules, 1);
        compSwitch?
        this.push('InflFlight_compCreateOrderScreen', {
            key: this.params.key,
            order: this.order,
            journey: journey,
            JourneyId:this.params.JourneyId
        })
        : this.push('IntlFlightCreateOrder', {
            key: this.params.key,
            order: this.order,
            journey: journey,
            JourneyId:this.params.JourneyId,
        })
        
    }

     /**
     * 合并行程
     */
      _mergeJourney = (journey) => {
        if (!journey || !this.selectedJourney) return false;
        var mergeJourney = {
            BasePrice: this.selectedJourney.BasePrice + journey.BasePrice,
            Tax: this.selectedJourney.Tax + journey.Tax,
            TotalPrice: this.selectedJourney.TotalPrice + journey.TotalPrice,
            SettlementPrice: this.selectedJourney.SettlementPrice + journey.SettlementPrice,
            TicketingCarrier: this.selectedJourney.TicketingCarrier,
            OWFlights: this.selectedJourney.OWFlights,
            RTFlights: journey.OWFlights,
            AirlineName: this.selectedJourney.AirlineName
        };
        if (journey.IntlFlightRules && this.selectedJourney.IntlFlightRules) {
            mergeJourney.IntlFlightRules = this.selectedJourney.IntlFlightRules.concat(journey.IntlFlightRules);
        } else if (journey.IntlFlightRules) {
            mergeJourney.IntlFlightRules = journey.IntlFlightRules;
        } else if (this.selectedJourney.IntlFlightRules) {
            mergeJourney.IntlFlightRules = this.selectedJourney.IntlFlightRules;
        }
        return mergeJourney;
    }

    /**
     * 处理航班
     */
    _processFlights = (flights, journeyType, policyList, policyIndex) => {
        if (!flights || !Array.isArray(flights.FlightSegments)) {
            return;
        }
        flights.FlightSegments.forEach(item => {
            var flightOrder = {
                Departure: item.DepartureCityName,
                DepartureEname: item.DepartureCityEname,
                DepartureCode: item.DepartureCityCode,
                DepartureNationalCode: item.DepartureNationalCode,
                DepartureNationalName: item.DepartureNationalName,
                DepartureAirport: item.DepartureAirport,
                DepartureAirportName: item.DepartureAirportName,

                Destination: item.ArrivalCityName,
                DestinationEname: item.ArrivalCityEname,
                DestinationCode: item.ArrivalCityCode,
                DestinationNationalCode: item.ArrivalNationalCode,
                DestinationNationalName: item.ArrivalNationalName,
                DestinationAirport: item.ArrivalAirport,
                DestinationAirportName: item.ArrivalAirportName,

                AirlineCode: item.Airline,
                AirlineName: item.AirlineName,
                AirlineNumber: item.FlightNumber,
                DepartureTerminal: item.DepartureTerminal,
                DestinationTerminal: item.ArrivalTerminal,
                DepartureTime: Util.Date.toDate(item.DepartureTime),
                DestinationTime: Util.Date.toDate(item.ArrivalTime),
                EquipType: item.Equipment,
                EquipmentDesc: item.EquipmentDesc,
                RouteType: journeyType,
                FlightTotalTime: item.Duration,
                CabinCode: item.ExInfos && item.ExInfos[0].PhysicalCabin,
                CabinName: item.ExInfos && item.ExInfos[0].CabinName,
                ServiceCabin: item.ExInfos && item.ExInfos[0].ResBookDesigCode,

                Tpm: item.TPM,
                BaggagePolicy: item.ExInfos && item.ExInfos[0].Baggage,
                StopOver: item.StopOvers,
                 Meal:item.Meal,
                 MealDesc:item.MealDesc
            };
            if (item.ShareAirlineCode) {
                flightOrder.ShareAirlineCode = item.ShareAirlineCode;
                flightOrder.ShareAirlineNumber = item.ShareAirlineNumber;
                flightOrder.ShareAirlineName = item.ShareAirlineName;
            }
            if (policyList && Array.isArray(policyList)) {
                //获取退改规则
                if (policyList[policyIndex]) {
                    flightOrder.ModifyPolicy = {
                        Intro: policyList[policyIndex].Intro,
                        Rules: policyList[policyIndex].Rules
                    }
                }
            }
            this.order.AirList.push(flightOrder);
        });
    }

    renderBody() {
        const { moreLoading, morePriceList, journey, lowPrices } = this.state;
        const { airPortData } = this.params;
        const { compSwitch } = this.props;
        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    ListHeaderComponent={
                        <View>
                            <PolicyView ref='policy' type='morePrice' />
                            <PolicyView2 ref='policy2' type='morePrice' />
                            <RuleView2 ref={o => this.ruleView2 = o} />
                            {this._renderJourney(journey.OWFlights, !this.selectedJourney)}
                            {this._renderJourney(journey.RTFlights, false)}
                        </View>
                    }
                    ListEmptyComponent={
                        moreLoading ? (
                            <View style={{ alignItems: 'center', marginTop: 10 }}>
                                <ActivityIndicator animating={true} />
                            </View>
                        ) : (
                                <View style={{ alignItems: 'center', marginTop: 10 }}>
                                    <CustomText style={{ color: 'gray', fontSize: 13 }} text='没有可用舱位，请选择其他舱位' />
                                </View>)
                    }
                    style={{ flex: 1 }}
                    data={this.state.showMore ? morePriceList : lowPrices}
                    showsVerticalScrollIndicator={false}
                    renderItem={this._renderMoreItem}
                    keyExtractor={(item, index) => (String(index))}
                    ListFooterComponent={this._renderFooter}
                />
                {this._testAlert()}
                <ListRtBottomView ref='lowPriceRtBottomView' otwThis={this} isSingle={true} callBack={this._orderBtnClick2} jump={false} compSwitch={compSwitch} airPortData={airPortData}   />
                <ListBottomView ref='lowPriceBottomView' otwThis={this} isSingle={true} callBack={this._orderBtnClick2} jump={false} compSwitch={compSwitch} airPortData={airPortData}   />
            </View>
        );
    }

    _renderFooter = () => {
            if (this.state.showMore) {
                return null;
            }
            if (this.state.showNoMoreCabinTip) {
                return (
                    <View style={{ height: 50, margin: 10, borderRadius:6, alignItems: 'center', justifyContent: "center", backgroundColor: "white" }}>
                        <CustomText text={I18nUtil.translate('当前航班无有效价格，请选择其他航班')} style={{ color: 'gray' }} />
                    </View>
                )
            }
            return (
                <TouchableHighlight underlayColor='transparent' onPress={this._showMore}>
                    <View style={{ height: 50, margin: 10, borderRadius:6, alignItems: 'center', justifyContent: "center", backgroundColor: "white" }}>
                        <CustomText text='更多舱位' style={{ color: Theme.theme }} />
                    </View>
                </TouchableHighlight>
            )
    }

    _hasMoreCabins = () => {
        const { morePriceList, lowPrices } = this.state;
        if (!Array.isArray(morePriceList) || morePriceList.length === 0) return false;
        if (!Array.isArray(lowPrices) || lowPrices.length === 0) return false;
        const lowKeySet = new Set(lowPrices.filter(Boolean).map(item => (item?.PriceId ?? item?.TotalPrice)));
        return morePriceList.some(item => item && (item.PriceId ?? item.TotalPrice) && !lowKeySet.has(item.PriceId ?? item.TotalPrice));
    }

    _showMore = () => {
        if (!this._hasMoreCabins()) {
            this.setState({ showNoMoreCabinTip: true });
            return;
        }
        this.setState({
            showMore: true,
            showNoMoreCabinTip: false,
        })
    }
    
    _orderBtnClick2 = (data) => {
        data.OWFlights = data.Journeys[0]
        data.RTFlights = data.Journeys[1]
        // if (this.props.highRisk) {
        //     this.showAlertView(this.props.highRisk.Message, () => {
        //         return ViewUtil.getAlertButton('确定', () => {
        //             this.dismissAlertView();
        //             if (this.props.highRisk.Level == 1) {
        //                 if (!data.EnableBook && this.props.feeType === 1) {
        //                     this.toastMsg('不符合您的差标规则，禁止预订');
        //                     return;
        //                 }
        //                 this._getTravelRule(data);
        //             }
        //         })
        //     });
        // } else {
            if (!data.EnableBook && this.props.feeType === 1) {
                this.toastMsg('不符合您的差标规则，禁止预订');
                return;
            }
            this._getTravelRule(data,'lowPrice');
        // }
    }

    _testAlert = () => {
        const { alertShow } = this.state;
        let _hightRist = this.isRt ? this.props.highRisk2 : this.props.highRisk
        if (!_hightRist || !_hightRist.Level ==1 || !alertShow){return}
        return(
          <View  style={{position:'absolute',top:-94, height:global.screenHeight, width:global.screenWidth}}>
            <View style={curStyle.container2}>
            {//图片宽250 高300， 头部高35，底部高40
                <View style={{ marginHorizontal:8,backgroundColor:'#fff',width:300, borderRadius:8 }}>
                  <View style={{height:40,alignItems:'center',justifyContent:'center',marginTop:5}}>
                      <CustomText  text='温馨提示' style={{fontSize:16}}/>
                  </View>
                  <ScrollView style={{width:'100%'}} keyboardShouldPersistTaps='handled'>
                         <HTMLView value={_hightRist.Message} style={{ padding:12}} /> 
                  </ScrollView>
                  <TouchableOpacity 
                        style={{height:40,alignItems:'center',justifyContent:'center',marginTop:10,borderTopWidth:1,borderColor:Theme.lineColor}}
                        onPress={()=>{
                           this._hightRist()
                        }}>
                        <CustomText  text='确定' style={{fontSize:18,color:Theme.theme}}/>
                  </TouchableOpacity>
                </View>
              }
              </View>
          </View>
        )
    }

    _hightRist = () => {
        const { itemData} = this.state;
        this._getTravelRule(itemData);
        this.setState({alertShow:false})
    }

    _DateCha = (item1,item2) => {
        let departureTime =  item1.split('T')[0]
        let arrivalTime =  item2.split('T')[0]
        let date = new Date(departureTime)
        let date2 = new Date(arrivalTime)
        return Math.floor((date2.getTime()-date.getTime())/(24*3600*1000))
    }

    _renderJourneyDetail = (flights, isFrom) => {
        if (Array.isArray(flights) && flights.length > 0) {
            const{airPortData } = this.params;
            let arriveDate = null;
            for (let item of flights) {
                if (arriveDate === null) {
                    arriveDate = Util.Date.toDate(item.ArrivalTime);
                } else {
                    let nextDate = Util.Date.toDate(item.DepartureTime);
                    item.transferTime = IntlFlightService.getTransferTime(arriveDate, nextDate);
                    arriveDate = Util.Date.toDate(item.ArrivalTime);
                }
            }            
            let isChinese = Util.Parse.isChinese();
            let DepartureAirport = '';
            let ArrivalAirport = '';
            let DepartureCityEnName = '';
            let ArrivalCityEnName = '';
            const {craftTypeList} = this.state
        
            return (
                <View  style={{ backgroundColor: 'white',paddingBottom:15}}>
                {
                    flights.map((item, index) => (
                        <View  style={{  }}>
                            {
                                airPortData&&airPortData.map((airPorItem)=>{
                                    if(airPorItem.AirportCode == item['DepartureAirport']){
                                        ArrivalCityEnName = airPorItem.CityEnName
                                        DepartureAirport = airPorItem.AirportEnName
                                    }
                                    if(airPorItem.AirportCode == item['ArrivalAirport']){
                                        ArrivalAirport = airPorItem.AirportEnName
                                        DepartureCityEnName = airPorItem.CityEnName
                                    }
                                })
                            }
                            {
                                item.transferTime ? (
                                    <View style={{marginTop:10,paddingHorizontal:15}}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center',}}>
                                            <Image source={require('../../res/Uimage/yuan_d.png')} style={{width:14,height:14,marginRight:5}}/>
                                            <Text allowFontScaling={false} style={{ color: Theme.orangeColor, fontSize: 12 }}>
                                                {I18nUtil.translate('中转')} {isChinese ? item.DepartureCityName : item.DepartureCityEname}  {item.transferTime} 
                                                {!(flights[index-1].ArrivalAirport == flights[index].DepartureAirport)?'(不同机场转机)':''}
                                            </Text>
                                        </View>
                                        {
                                            (!flights[index-1].ArrivalAirport == flights[index].DepartureAirport)?
                                            <Text allowFontScaling={false} style={{ color: Theme.assistFontColor, fontSize: 11,marginLeft:20 }}>
                                                { flights[index-1].ArrivalAirportName+'换成'+flights[index].DepartureAirportName + '请合理安排您的时间和行程'}
                                            </Text>:null
                                        }
                                    </View>
                                ) : null
                            }
                            <View style={{backgroundColor: Theme.lineColor2,marginHorizontal:15,marginTop:10,borderRadius:4,paddingHorizontal:20,paddingTop:10}}>
                                <View style={{ flexDirection: 'row',  }}>
                                    <View style={{ flex: 1 }}>
                                        <Text allowFontScaling={false} style={{ fontSize: 13, color:Theme.commonFontColor }}>{Util.Date.toDate(item.DepartureTime).format('yyyy-MM-dd')}</Text>
                                        <Text allowFontScaling={false} style={{ fontSize: 26, color:Theme.fontColor }}>{Util.Date.toDate(item.DepartureTime).format('HH:mm')}</Text>
                                        <Text allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 12, marginTop:5 }}>{Util.Parse.isChinese() ? item.DepartureAirportName : DepartureAirport} {item.DepartureTerminal}</Text>
                                    </View>
                                    <View style={{alignItems:'center',justifyContent:'center'}}>
                                        {
                                            item.Duration ? (
                                                <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 12 }}>{item.Duration.replace(':', 'h')}</Text>
                                            ) : null
                                        }
                                        {
                                            item.StopOvers ?
                                            <TouchableOpacity onPress={this._getFlightStopInfo.bind(this, data)}>
                                                <Image source={Util.Parse.isChinese() ? require('../../res/Uimage/flightFloder/_zstop.png') : require('../../res/Uimage/flightFloder/_estop.png')} style={{ width: 60, height: 10 }}></Image>
                                            </TouchableOpacity>
                                            : 
                                            <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                                        }
                                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 12 }}>{item.StopOvers ?item.StopOvers[0].CityName:''}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text allowFontScaling={false} style={{ fontSize: 13, color:Theme.commonFontColor }}>{Util.Date.toDate(item.ArrivalTime).format('yyyy-MM-dd')}</Text>
                                        <View style={{flexDirection:'row'}}>
                                            <Text allowFontScaling={false} style={{ fontSize: 26, color:Theme.fontColor  }}>{Util.Date.toDate(item.ArrivalTime).format('HH:mm')}</Text>
                                            {
                                                flights[0].DepartureDate != flights[flights.length - 1] && this._DateCha(item.DepartureTime, item.ArrivalTime) > 0 ?
                                                    <CustomText style={{ marginRight: -11, fontSize: 10, marginLeft: 3 }} text={'+' + this._DateCha(item.DepartureTime, item.ArrivalTime) } />
                                                : null
                                            }
                                        </View>
                                        <Text allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 12, marginTop:5 }}>{Util.Parse.isChinese() ? item.ArrivalAirportName : ArrivalAirport} {item.ArrivalTerminal}</Text>
                                    </View>
                                </View>
                                <Text allowFontScaling={false} style={{ color: Theme.assistFontColor, fontSize: 12,marginTop:10,marginBottom:10 }}>
                                    <CropImage code={item.Airline} />
                                    {Util.Parse.isChinese() ? item.AirlineName : ""}{item.Airline}{item.FlightNumber} | {Util.Read.planType(item.Equipment,craftTypeList)} | {I18nUtil.translate(item.MealDesc)}
                                </Text>
                            </View>
                        </View>
                    ))
                }
                </View>
            );
        }
        return null;
    }

    _renderJourney = (journey, isFrom) => {
        if (!journey) {
            return null;
        }
        if (journey.showDetail === undefined) {
            journey.showDetail = true;
        }
        let isChinese = Util.Parse.isChinese();
        return (
            <View>
                <View style={{backgroundColor:Theme.greenBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',paddingHorizontal:20,paddingVertical:10}}>
                  <View style={{flexDirection:'row',alignItems:'center'}}>
                  {
                        isFrom ? (
                            <View style={{ marginRight:5}}>
                                <CustomText style={{ fontSize: 11, color: 'white',backgroundColor: Theme.theme, paddingHorizontal: 4,borderRadius:2, }} text='去程' />
                            </View>
                        ) : (
                            <View style={{fontSize: 11, color: 'white',backgroundColor: Theme.theme, paddingHorizontal: 4,borderRadius:2, }}>
                                <CustomText style={{ fontSize: 11, color: 'white' }} text='回程' />
                            </View>
                        )
                  }
                  <Text allowFontScaling={false} style={{ color:Theme.theme,fontSize:14 }} numberOfLines={1}>{journey.beginDate && journey.beginDate.format('yyyy-MM-dd')} </Text>
                  { Util.Parse.isChinese() ? <CustomText text={Util.Date.getWeekDesc(journey.beginDate)} style={{ color: Theme.theme }} /> : null}
                  </View>  
                  <Text allowFontScaling={false} style={{ color:Theme.theme,fontSize: 13}} numberOfLines={1}>{I18nUtil.translate('总时长')} {journey.durationDesc}</Text>
                </View>
                {
                    journey.showDetail ? (
                        this._renderJourneyDetail(journey.FlightSegments, isFrom)
                    ) : null
                }
            </View>
        );
    }
    getViolationModeDesc = (mode) => {
        const modeMap = {
          0: '超标弹窗提示',
          1: '超标禁止预订',
          2: '超标审批',
          3: '超标现付',
          4: '超标自选审批或现付',
        };
        return modeMap[mode] || '未知处理模式';
      }
    _alert = (obj) => {
        Pop.show(
            <View style={curStyle.popStyle}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',margin:20}}>
                    <CustomText text={'违背政策详情'} style={{fontSize:15,fontWeight:'bold',color:Theme.RedMarkColor}}/>
                    <TouchableOpacity onPress={()=>{Pop.hide()}}>
                    <FontAwesome name='close' size={15} color={Theme.darkColor} style={{marginLeft:10}}></FontAwesome>
                    </TouchableOpacity>
                </View>
                <View style={{width:'100%',height:1,backgroundColor:Theme.lineColor}}></View>
                {
                    obj.map((item)=>{
                        return (
                            <View style={{padding:10,backgroundColor:Theme.pinkBg,marginHorizontal:20,marginTop:15,borderRadius:8}}>
                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                <FontAwesome name='exclamation-circle' size={15} color={Theme.RedMarkColor} style={{marginLeft:10}}></FontAwesome>
                                <CustomText text={item.RuleTypeDesc} style={{color:Theme.RedMarkColor,marginLeft:5}}/>
                                </View>
                                <CustomText text={this.getViolationModeDesc(item.ViolationMode)} style={{marginLeft:30}}/>
                            </View>
                        )
                    })
                }
            </View>,
            {animationType: 'slide-up', maskClosable: true, onMaskClose: ()=>{}}
        )
    }
    _renderMoreItem = ({ item:data,index }) => {
        const { feeType,compSwitch,highRisk,highRisk2 } = this.props;
        const { isOnlyApply,selectedIndex,ItemIndex } = this.state;
        let index1 = index;
        let item = data;
        if(!item.selectedIndex ){
            item.selectedIndex = 0;
        }else{
            item.selectedIndex = item.selectedIndex;
        }
        let AdtPriceArr = [item];
        if(item.PartFlights){
            AdtPriceArr.push(...data.PartFlights);
        }
        if(index1 === ItemIndex){//ItemIndex: 当前选中项的index
            item = AdtPriceArr[selectedIndex];
            item.selectedIndex = selectedIndex
        }

        
        let _hightRist = this.isRt ? highRisk2 : highRisk
        let cabins = [];
        let minCabinCount = 0;
        if (item?.OWFlights && Array.isArray(item?.OWFlights?.FlightSegments)) {
            let curCabins = item.OWFlights.FlightSegments.map(flight => {
                let exInfo = flight.ExInfos[0];
                if (flight.ResBookDesigPairs.hasOwnProperty(exInfo.ResBookDesigCode)) {
                    if (minCabinCount == 0) {
                        minCabinCount = flight.ResBookDesigPairs[exInfo.ResBookDesigCode];
                    } else {
                        if (minCabinCount > flight.ResBookDesigPairs[exInfo.ResBookDesigCode]) {
                            minCabinCount = flight.ResBookDesigPairs[exInfo.ResBookDesigCode];
                        }
                    }
                }
                // return (Util.Parse.isChinese() ? exInfo.CabinName : exInfo.PhysicalCabin + ' ') + exInfo.ResBookDesigCode;
                return (Util.Parse.isChinese() ? exInfo.CabinName : exInfo.PhysicalCabin + ' ');
            });
            cabins.push(curCabins.join());
        }
        if (item?.RTFlights && Array.isArray(item?.RTFlights.FlightSegments)) {
            let curCabins = item.RTFlights.FlightSegments.map(flight => {
                let exInfo = flight.ExInfos[0];
                if (flight.ResBookDesigPairs.hasOwnProperty(exInfo.ResBookDesigCode)) {
                    if (minCabinCount == 0) {
                        minCabinCount = flight.ResBookDesigPairs[exInfo.ResBookDesigCode];
                    } else {
                        if (minCabinCount > flight.ResBookDesigPairs[exInfo.ResBookDesigCode]) {
                            minCabinCount = flight.ResBookDesigPairs[exInfo.ResBookDesigCode];
                        }
                    }
                }
                // return (Util.Parse.isChinese() ? (exInfo.CabinName ? exInfo.CabinName : exInfo.PhysicalCabin) : exInfo.PhysicalCabin + ' ') + exInfo.ResBookDesigCode;
                return (Util.Parse.isChinese() ? (exInfo.CabinName ? exInfo.CabinName : exInfo.PhysicalCabin) : exInfo.PhysicalCabin + ' ') ;
            });
            cabins.push(curCabins.join());
        }
       
        let btnTxt = this.isCustomerTab && !this.selectedJourney ? '选订' : '预订';
        return (
            <View style={{backgroundColor: 'white',marginHorizontal:10,marginTop:8, borderRadius:6}}>
                {
                    item?.MorePriceTag ?
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ backgroundColor: Theme.orangeBg,borderTopLeftRadius:6,borderBottomRightRadius:6  }}>
                                <CustomText style={{ color: Theme.orangeColor, fontSize: 11,paddingHorizontal:5, paddingVertical:2}} text={item.MorePriceTag} />                                
                            </View>
                            </View> 
                        :
                        null
                }
                <ScrollView style={{ height:40,marginHorizontal:10}} horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection: 'row',minWidth: '100%'}}>
                    {
                       AdtPriceArr.map((flight,index) => {
                            //所有AllowPieces和AllowWeight的和
                            let alloCount = 0;
                            let alloCount2 = 0;
                            flight?.Journeys?.forEach((item) => {
                                item?.FlightSegments?.forEach((item2) => {
                                  let baggage = item2?.ExInfos?.[0]?.Baggage;
                                  if (baggage?.AllowPieces) {
                                    alloCount += Number(baggage.AllowPieces);
                                  }
                                  if (baggage?.AllowWeight) {
                                    alloCount += Number(baggage.AllowWeight);
                                  }
                                });
                            });
                            AdtPriceArr?.[index-1]?.Journeys?.forEach((item) => {
                                item?.FlightSegments?.forEach((item2) => {
                                  let baggage = item2?.ExInfos?.[0]?.Baggage;
                                  if (baggage?.AllowPieces) {
                                    alloCount2 += Number(baggage.AllowPieces);
                                  }
                                  if (baggage?.AllowWeight) {
                                    alloCount2 += Number(baggage.AllowWeight);
                                  }
                                });
                            });
                            return(
                                <View>
                                    {flight.AdtPrice?
                                    <TouchableOpacity key={index} onPress={ () => this._orderLowPriceOperation(flight,index,item,index1) } 
                                    style={{alignItems:'center', justifyContent:'center',paddingHorizontal:10,borderBottomColor:Theme.theme,
                                        borderBottomWidth: index == item.selectedIndex ? 1.5 : 0,
                                        backgroundColor: index == item.selectedIndex ? Theme.greenBg : '#fff'
                                    }}>
                                        <CustomText text={"¥"+flight.AdtPrice} style={{fontSize:12,color:Theme.theme}}/>
                                        <CustomText text={index===0 ? '最优票价' : index > 0 && alloCount == alloCount2 ? '灵活退改' : '更多行李'} style={{fontSize:12,color:Theme.theme}}/>
                                    </TouchableOpacity>
                                    :
                                    <View></View>}
                                </View>
                            )
                        })
                    }
                    {
                        (AdtPriceArr.length === 2 && AdtPriceArr[1]===1) || (AdtPriceArr.length === 1 && index === 0 && index1==0) ?
                        <View  style={{alignItems:'center', justifyContent:'center',paddingHorizontal:10}}>
                            <CustomText text={'无更优价格'} style={{fontSize:12,color:Theme.theme,fontWeight:'bold'}}/>
                        </View> 
                        :null

                    }
                    {
                        AdtPriceArr?.length == 1 && index1 !== 0 ? 
                            <TouchableOpacity onPress={() => this._morePriceOperation(item)} style={{alignItems:'center', justifyContent:'center',paddingHorizontal:10}}>
                                <CustomText text={'更多价格'} style={{fontSize:12,color:Theme.theme,fontWeight:'bold'}}/>
                            </TouchableOpacity> 
                        : null
                    }
                    
                </ScrollView>
                <View style={{flex:1,  flexDirection: 'row', alignItems:'center', paddingHorizontal:20, paddingVertical:10 }}>
                <View style={{  flexDirection: 'row',flex:7 }}>
                    <View style={{ alignItems: 'flex-start' }}>
                        <View style={{  flexDirection: 'row', justifyContent: 'space-between',alignItems:'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 5 }}>
                                <CustomText style={{fontSize: 14,fontWeight:'bold'}} text='¥' />
                                <CustomText style={{ fontSize: 20,fontWeight:'bold' }} text={item.AdtPrice} />
                            </View>
                        </View>
                        <View style={{  justifyContent: 'flex-start',flexDirection:'row',flexWrap: 'wrap', }}>
                                {
                                    cabins.map((cabin, index) => (
                                        <Text allowFontScaling={false} key={index} style={[{ color: Theme.fontColor, fontSize: 13 }, index === 0 ? null : { marginRight: 4 }]}>{item.cabinName} {cabin}</Text>
                                    ))
                                }
                            </View>
                        <View style={{flexDirection:'row', marginTop:5}}>
                        {
                            ( feeType===1)?
                                <TouchableOpacity 
                                    style={{marginRight:4}} 
                                    onPress={()=>{
                                        if(item.ViolationRules && item.ViolationRules.length>0){
                                            this._alert(item.ViolationRules)
                                        }
                                    }}>
                                    <CustomText text={(item.ViolationRules && item.ViolationRules.length>0) ?'违背':'符合'} 
                                        style={{ backgroundColor: (item.ViolationRules && item.ViolationRules.length>0) ?Theme.redColor:Theme.theme, borderRadius: 2, color: '#fff', paddingHorizontal: 5, fontSize: 11, paddingVertical:1, }}
                                    />
                                </TouchableOpacity>
                            :null
                        }
                        {
                                item.PriceList&&item.PriceList[0]&&item.PriceList[0].IsNegotiatedFare?
                                <View style={{ backgroundColor: Theme.orangelableColor, borderRadius: 2, color: '#fff', paddingHorizontal: 5, fontSize: 11, marginRight:4, paddingVertical:1}}>
                                    <CustomText text='协议' style={{ color: "white", fontSize: 12 }} />
                                </View>
                                :null 
                        }
                        <CustomText style={{ fontSize: 12, marginRight: 10 ,color:Theme.commonFontColor }}  text={'CO₂ : '+item.Journeys[0].FlightSegments[0].CarbonEmission+"kg"} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginRight: 40 }}>
                            <TouchableOpacity onPress={() => this._showModifyPolicy(item,false,1)}>
                                <CustomText style={{ color: Theme.theme, fontSize: 12,textDecorationLine: 'underline',textDecorationStyle:'solid',marginRight:8 }} text='退改规则' />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => this._showModifyPolicy(item,false,2)}>
                                <CustomText style={{ color: Theme.theme, fontSize: 12,textDecorationLine: 'underline',textDecorationStyle:'solid' }} text='行李说明' />
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
               { 
                isOnlyApply||(!item.EnableBook && this.props.feeType === 1)?
                    <View style={{ justifyContent: 'flex-end'}}>
                        <TouchableHighlight style={{ backgroundColor:'gray', padding: 5, borderRadius: 2  }} 
                                            onPress={() =>{
                                                if(!item.EnableBook && this.props.feeType === 1){
                                                    this.toastMsg(item.BlockBookingReason||'不符合您的差标规则，禁止预订');
                                                    return;
                                                }else{
                                                    this.toastMsg("请选择申请单预订");
                                                    return;
                                                }
                                            }} underlayColor={'gray'}>
                            <CustomText style={{ color: 'white' }} text={btnTxt} />
                        </TouchableHighlight>
                    </View>
                    :
                    <View style={{ justifyContent: 'flex-end' }}>
                        <TouchableHighlight style={{ backgroundColor:(_hightRist &&_hightRist.Level===2)?Theme.assistFontColor: Theme.theme, padding: 5, borderRadius: 2 }} 
                                            onPress={() => this._btnReserve(item)} underlayColor={'gray'}>
                            <CustomText style={{ color: 'white' }} text={btnTxt} />
                        </TouchableHighlight>
                        {
                            minCabinCount < 9 ? (
                                <Text allowFontScaling={false} style={{ color: Theme.theme, fontSize: 10 }}>{I18nUtil.translate('剩余')} {minCabinCount} {I18nUtil.translate('张')}</Text>
                            ) : null
                        }
                    </View>
               }
            </View>
            </View>
            
        );
    }
    _morePriceOperation(flight,index){
        const {queryModel} = this.state;
        const {apply} = this.props
        let params = Util.Encryption.clone(this.params);
        let Travellers = this.props.comp_userInfo?.employees.concat(this.props.comp_userInfo?.travellers);
        let PassengerTypeQuantitys = [{ Code: 'ADT', Quantity:Travellers.length }]
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
        let model = {
            RulesTravelId:queryModel.RulesTravelId,
            IsOnlyDirect:params.filterOptions&&params.filterOptions.isDirect,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            PassengerTypeQuantity:PassengerTypeQuantitys,
            IntlFlightInfo:flight,
            ApplyId:apply&&apply.Id,
            JourneyId:journeyid,
        }
        this.showLoadingView();
        IntlFlightService.getIntlFlightQueryByPriceI(model).then(response => {
            this.hideLoadingView();
            if(response.data.length == 0){
                this.toastMsg('暂无更优价格');
                // flight.PartFlights = response.data;
                flight.PartFlights = [1];
                
            }else{
                flight.PartFlights = response.data;
            }
            this.setState({ 
            });
        }).catch(err => {
            this.hideLoadingView();
        });
    }
     _orderLowPriceOperation(flight,index,item,ItemIndex){
        item.selectedIndex = index
        flight.OWFlights = flight.Journeys?.[0] || {}
        if(flight.Journeys.length>1 && flight.Journeys?.[1]){
            flight.RTFlights = flight.Journeys?.[1]
        }
        flight.BasePrice = flight.PriceList?.[0].BasePrice || 0
        flight.Tax = item.Tax
        flight.TotalPrice = item.AdtPrice
        flight.SettlementPrice = item.AdtPrice
        this.setState({ 
            selectedIndex: index,
            ItemIndex:ItemIndex
        });
    }
}

const getStateProps = state => ({
    feeType: state.feeType.feeType,
    apply: state.apply.apply,
    compSwitch:state.compSwitch.bool,
    highRisk2:state.highRisk2.highRisk2,
    highRisk:state.highRisk.highRisk,
    customerInfo_userInfo: state.customerInfo_userInfo,
    comp_userInfo:state.comp_userInfo,
    compReferenceEmployee: state.compReferenceEmployee.ReferenceEmployee,//综合订单出差人选定参考出差人信息
})
export default connect(getStateProps)(MorePriceListScreen);

const curStyle = StyleSheet.create({
    borderTop: {
        borderTopColor: Theme.lineColor,
        borderTopWidth: 1
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    titleText: {
        fontSize: 16,
        color: Theme.fontColor
    },
    alertStyle:{
        width: '80%', 
        backgroundColor:'#fff',
        borderRadius:8,
        padding:10,
    },
    container2:{
        flex:1,
        backgroundColor:'rgba(0, 0, 0, 0.4)',
        justifyContent:'center',
        alignItems:'center'
    },
    popStyle:{height:500,
        backgroundColor:'#fff',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0
    }     
});

// /**
//  * 获取航司名称
//  */
// const getAirlineName = (airlineCode) => {
//     if (airlines && Array.isArray(airlines)) {
//         let index = airlines.findIndex(airline => (airline.Code === airlineCode));
//         if (index === -1) {
//             return null;
//         }
//         return airlines[index].CnShortName;
//     }
// }
