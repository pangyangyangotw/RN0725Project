import React from 'react';
import {
    Modal,
    View,
    Image,
    TouchableHighlight,
    ScrollView,
    Alert
} from 'react-native';
import Theme from '../../res/styles/Theme';
import DeviceUtil from '../../util/DeviceUtil';
import CustomText from '../../custom/CustomText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Util from '../../util/Util';
import ViewUtil from '../../util/ViewUtil';
export default class ListRtBottomView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            data: null,
            selectItem: null
        }
    }

    showView(obj) {
        if (!obj) return;
        this.setState({
            visible: true,
            data: obj
        })
    }

    _orderLowPriceOperation = () => {
        const { selectItem } = this.state;
        const { otwThis, callBack } = this.props;
        if (!selectItem) {
            // otwThis.toastMsg('请选择最低价航班'); 
            Util.Parse.isChinese()? 
            Alert.alert('温馨提示', '请选择最低价航班',
                [
                    {text: '确定', onPress: () => console.log('确定')}
                ]
            )
            : 
            Alert.alert('Notice', 'Please select the cheapest flight',
                [
                    {text: 'OK', onPress: () => console.log('OK')}
                ]
            );          
            return;   
        }
        selectItem.BasePrice = selectItem.PriceList[0].BasePrice
        selectItem.Tax = selectItem.PriceList[0].Tax
        selectItem.SettlementPrice = selectItem.PriceList[0].SettlementPrice
        selectItem.TotalPrice = selectItem.PriceList[0].TotalPrice
       
        this.setState({
            selectItem: null,
            visible: false
        }, () => {
            callBack(selectItem);
        })
    }

    _continuteOrder = () => {
        const { otwThis,compSwitch,jump } = this.props;
        const { data } = this.state
        this.setState({
            visible: false
        }, () => {
            if (this.props.isSingle) { 
                // if(jump){
                //     compSwitch ?
                //     otwThis.push('Flight_compCreatOrderScreen', data)
                //     :
                //     otwThis.push('FlightOrderScreeb', data);
                // }else{
                //     otwThis.push('FlightRuleScreen', this.state.data);
                // }
                try {
                    if (!data || !data.journey) {
                        otwThis?.toastMsg?.(Util.Parse.isChinese() ? '数据异常，请重新选择航班' : 'Data error, please reselect the flight');
                        return;
                    }
                    if (data.ViolationRules && data.ViolationRules.length > 0) {
                        otwThis.push('IntFlightRtRuleScreen', data);
                    } else {
                        this._convertToOrder(data.journey, data.backRuleModel, data.backRuleModelArr, data);
                    }
                } catch (e) {
                    otwThis?.toastMsg?.(e?.message || (Util.Parse.isChinese() ? '操作失败' : 'Operation failed'));
                }
                
            } else { 
                // if(jump){
                //     otwThis.push('FlightRtList', data);
                // }else{
                //     otwThis.push('FlightRuleScreen', this.state.data);
                // }
            }
        })
    }

    _convertToOrder = (journey,backRuleModel,backRuleModelArr,data) => {
        if(!journey){
            return
        }
        const { otwThis,compSwitch } = this.props;
        const owFlights = Array.isArray(journey.OWFlights) ? journey.OWFlights[0] : journey.OWFlights;
        this.order = {
            DepartureNationalCode: data?.queryModel?.DepartureNationalCode,
            DestinationNationalCode: data?.queryModel?.DestinationNationalCode,
            Departure: owFlights?.DepartureCityName,
            DepartureCode: owFlights?.DepartureAirport,
            Destination: owFlights?.ArrivalCityName,
            DestinationCode: owFlights?.ArrivalAirport,
            JourneyType: data.isRt ? 2 : 1,//1:单程，2:往返
            IsCustomTrip: data.isCustomerTab,
            AirList: [],
            BasePrice: journey.BasePrice,
            Tax: journey.Tax,
            SettlementPrice: journey.SettlementPrice,
            TotalPrice: journey.TotalPrice,
            TicketingCarrier: journey.TicketingCarrier,
            AccountCode: null,
            JourneyId:data.JourneyId,
            PriceList:journey.PriceList,
        };
        
        this._processFlights(owFlights, journey.RTFlights ? 21 : 1, journey.IntlFlightRules, 0);
        this._processFlights(journey.RTFlights, 22, journey.IntlFlightRules, 1);
        compSwitch?
        otwThis.push('InflFlight_compCreateOrderScreen', {
            key: data.key,
            order: this.order,
            journey: journey,
            backRuleModel:backRuleModel,
            backRuleModelArr: backRuleModelArr,
            goRuleModel:data.goRuleModel,
            goRuleModelArr:data.goRuleModelArr

        })
        : otwThis.push('IntlFlightCreateOrder', {
            key: data.key,
            order: this.order,
            journey: journey,
            backRuleModel:backRuleModel,
            backRuleModelArr: backRuleModelArr,
            goRuleModel:data.goRuleModel,
            goRuleModelArr:data.goRuleModelArr
        })
        
    }
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

    _selectJourney = (item) => {
        if (this.state.selectItem && this.state.selectItem === item) {
            this.setState({
                selectItem: null
            })
        } else {
            this.setState({
                selectItem: item
            })
        }
    }

    _renderList = () => {
        const { data, selectItem } = this.state;
        const { airPortData } = this.props;
        return (
            data?.LowPriceFights?
            <ScrollView style={{height:data?.LowPriceFights.length > 2 ? 500 : null}} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
                {
                    data?.MatchTravelRules?.unmatchlist?.map((list, index) => {
                       if(list.LowPriceFights){
                        return list.LowPriceFights.map(item=>{
                            if (!item) return null;
                            let journeysItem1 = item.Journeys[0]
                            let journeysItem2 = item.Journeys&&item.Journeys[1]
                           
                            let FlightSegment1 = journeysItem1.FlightSegments[0]
                            let FlightSegment11 = journeysItem1.FlightSegments[journeysItem1.FlightSegments.length-1]
                            let FlightSegment2 = journeysItem2&&journeysItem2.FlightSegments[0]
                            let FlightSegment22 = journeysItem2.FlightSegments[journeysItem2.FlightSegments.length-1]
                            let goDepart = `${FlightSegment1.DepartureTime.split('T')[1].slice(0, -3)}`                        
                            let arrivalDepart = `${FlightSegment11.ArrivalTime.split('T')[1].slice(0, -3)}`
                            let DepartureAirport1 = FlightSegment1.DepartureAirportName+" "+FlightSegment1.DepartureTerminal
                            let ArrivalAirport1 = FlightSegment11.ArrivalAirportName+" "+FlightSegment11.ArrivalTerminal

                            let goDepart2 = `${FlightSegment2.DepartureTime.split('T')[1].slice(0, -3)}`                       
                            let arrivalDepart2 = `${FlightSegment22.ArrivalTime.split('T')[1].slice(0, -3)}`
                            let DepartureAirport2 = FlightSegment2.DepartureAirportName+" "+FlightSegment2.DepartureTerminal
                            let ArrivalAirport2 = FlightSegment22.ArrivalAirportName+" "+FlightSegment22.ArrivalTerminal

                            let DepartDate1 = FlightSegment1.DepartureTime.split('T')[0].slice(-5)
                            let DepartDate2 = FlightSegment2.DepartureTime.split('T')[0].slice(-5)
                            let ChangeAir1 = journeysItem1.FlightSegments&&journeysItem1.FlightSegments.length > 1 ? true : false
                            let ChangeAir2 = journeysItem2.FlightSegments&&journeysItem2.FlightSegments.length > 1 ? true : false
                            let ArrivalCityEnName1 = '';
                            let ArrivalCityEnName2 = '';
                            let _departureAirport1 = '';
                            let _arrivalAirport1 = '';
                            let _departureAirport2 = '';
                            let _arrivalAirport2 = ''
                            airPortData&&airPortData.map((item)=>{
                                if(item.AirportCode == journeysItem1['DepartureAirport']){
                                    _departureAirport1 = item.AirportEnName
                                }
                                if(item.AirportCode == journeysItem1['ArrivalAirport']){
                                    _arrivalAirport1 = item.AirportEnName
                                }
                                if(item.AirportCode == journeysItem2['DepartureAirport']){
                                    _departureAirport2 = item.AirportEnName
                                }
                                if(item.AirportCode == journeysItem2['ArrivalAirport']){
                                    _arrivalAirport2 = item.AirportEnName
                                }
                                if(item.AirportCode == FlightSegment1['ArrivalAirport']){
                                    ArrivalCityEnName1 = item.CityEnName
                                }
                                if(item.AirportCode == FlightSegment2['ArrivalAirport']){
                                    ArrivalCityEnName2 = item.CityEnName
                                }
                            })

                            return (
                                <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectJourney.bind(this, item)}>
                                    <View style={{ backgroundColor:Theme.greenBg,paddingHorizontal:12,paddingVertical:18,marginTop:10,borderRadius:6,marginHorizontal:10 }}>
                                         
                                        <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                                              
                                                <View>
                                                    <View style={{flexDirection:'row', alignItems: 'center'}}>
                                                        <CustomText text={'¥' + item.AdtPrice} style={{ fontSize: 20, color: Theme.theme, marginLeft: 5 }} />
                                                        <View style={{flexDirection:'row'}}>
                                                        <CustomText text={'税'} style={{ fontSize: 13,color: Theme.darkColor, marginLeft: 5 }} />
                                                        <CustomText text={'¥' + item.PriceList[0].Tax} style={{ fontSize: 13,color: Theme.darkColor }} />
                                                        </View>
                                                    </View>
                                                    <View style={{backgroundColor:'#fff',padding:10,borderRadius:4 }}>
                                                        <View style={{ flexDirection: 'row' }}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',width:global.screenWidth-80}}>
                                                                    <View style={{ }}>
                                                                        <CustomText text={goDepart} style={{ fontSize: 20 }} />
                                                                        <CustomText text={Util.Parse.isChinese()? DepartureAirport1: _departureAirport1} style={{ fontSize: 13,color:Theme.commonFontColor, marginTop: 5 }} />
                                                                    </View>
                                                                    {
                                                                        ChangeAir1?
                                                                        <View style={{ alignItems: 'center' }}>
                                                                            <Image style={{ height: 10, width: 60 }} source={Util.Parse.isChinese()? require('../../res/Uimage/flightFloder/zhongzhuan.png'):require('../../res/Uimage/flightFloder/zhongzhuan_e.png')} />
                                                                            <CustomText style={{ fontSize: 10, color: Theme.orangeColor }} 
                                                                                    text={Util.Parse.isChinese() ? FlightSegment1['ArrivalCityName'] : ArrivalCityEnName1}                                         
                                                                                />
                                                                            {/* <CustomText style={{ fontSize: 10, borderColor: Theme.theme, color: Theme.theme, borderWidth: 0.5}} text='转' />
                                                                            <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                                                                            <CustomText style={{ fontSize: 10, color: Theme.theme }} 
                                                                                text={Util.Parse.isChinese() ? FlightSegment1['ArrivalCityName'] : ArrivalCityEnName1}                                         
                                                                            /> */}
                                                                        </View>
                                                                        :
                                                                        <View style={{ alignItems: "center", justifyContent: 'center' }}>
                                                                            {
                                                                                data.fltInfo && data.fltInfo.Stop > 0 
                                                                                ?
                                                                                <TouchableOpacity onPress={this._getFlightStopInfo.bind(this, data)}>
                                                                                    <Image source={Util.Parse.isChinese() ? require('../../res/Uimage/flightFloder/_zstop.png') : require('../../res/Uimage/flightFloder/_estop.png')} style={{ width: 60, height: 10 }}></Image>
                                                                                </TouchableOpacity> 
                                                                                :
                                                                                <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                                                                            }
                                                                        </View>
                                                                    }
                                                                    
                                                                    <View style={{alignItems: 'flex-end'  }}>
                                                                        <CustomText text={arrivalDepart} style={{ fontSize: 20 }} />
                                                                        <CustomText text={Util.Parse.isChinese() ? ArrivalAirport1 : _arrivalAirport1} style={{ fontSize: 13,color:Theme.commonFontColor, marginTop: 5 }} />
                                                                    </View>
                                                                    </View>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5,alignItems: 'center'  }}>
                                                      
                                                            
                                                                <CustomText style={{ marginRight: 5, marginTop: 5, height: 15, fontSize: 12, color: 'gray', textAlign: 'center' }} 
                                                                            text={DepartDate1} />
                                                                <CustomText style={{  marginTop: 5, height: 15, fontSize: 12, color: 'gray', textAlign: 'center' }} text={(Util.Parse.isChinese() ? FlightSegment1.AirlineName : '') + ' ' +  FlightSegment1.Airline + FlightSegment1.FlightNumber + ' ' + journeysItem1.Duration } />
                                                            
                                                        </View>
                                                    </View>
                                                    
                                                    <View style={{backgroundColor:'#fff',padding:10,borderRadius:4,marginTop:5 }}>
                                                            <View style={{ flexDirection: 'row' }}>
                                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems:'center',width:global.screenWidth-80}}>
                                                                    <View style={{ }}>
                                                                        <CustomText text={goDepart2} style={{ fontSize: 20 }} />
                                                                        <CustomText text={Util.Parse.isChinese()? DepartureAirport2: _departureAirport2} style={{ fontSize: 13,color:Theme.commonFontColor, marginTop: 5 }} />
                                                                    </View>
                                                                    {
                                                                        ChangeAir2?
                                                                        <View style={{ alignItems: 'center' }}>
                                                                            <Image style={{ height: 10, width: 60 }} source={Util.Parse.isChinese()? require('../../res/Uimage/flightFloder/zhongzhuan.png'):require('../../res/Uimage/flightFloder/zhongzhuan_e.png')} />
                                                                            <CustomText style={{ fontSize: 10, color: Theme.orangeColor }} 
                                                                                    text={Util.Parse.isChinese() ? FlightSegment2['ArrivalCityName'] : ArrivalCityEnName2}                                         
                                                                                />
                                                                        </View>
                                                                        :
                                                                        <View style={{ alignItems: "center", justifyContent: 'center' }}>
                                                                            {
                                                                                data.fltInfo && data.fltInfo.Stop > 0 
                                                                                ?
                                                                                <TouchableOpacity onPress={this._getFlightStopInfo.bind(this, data)}>
                                                                                    <Image source={Util.Parse.isChinese() ? require('../../res/Uimage/flightFloder/_zstop.png') : require('../../res/Uimage/flightFloder/_estop.png')} style={{ width: 60, height: 10 }}></Image>
                                                                                </TouchableOpacity> 
                                                                                :
                                                                                <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                                                                            }
                                                                        </View>
                                                                    }
                                                                    
                                                                    <View style={{ alignItems: 'center',alignItems: 'flex-end' }}>
                                                                        <CustomText text={arrivalDepart2} style={{ fontSize: 18 }} />
                                                                        <CustomText text={Util.Parse.isChinese() ? ArrivalAirport2 : _arrivalAirport2} style={{ fontSize: 13,color:Theme.commonFontColor, marginTop: 5 }} />
                                                                    </View>
                                                                    </View>
                                                            </View>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 5, alignItems: 'center' }}>
                                                            
                                                                <CustomText style={{ marginRight: 5, marginTop: 5, height: 15, fontSize: 12, color: 'gray', textAlign: 'center' }} 
                                                                            text={DepartDate2} />
                                                                <CustomText style={{ marginTop: 5, height: 15, fontSize: 12, color: 'gray', textAlign: 'center' }} text={(Util.Parse.isChinese() ? FlightSegment2.AirlineName : '') + ' ' + FlightSegment2.Airline + FlightSegment2.FlightNumber + ' ' + journeysItem2.Duration } />
                                                        </View>
                                                    </View>
                                                </View>
                                                <MaterialIcons
                                                    name={selectItem === item ? 'check-box' : 'check-box-outline-blank'}
                                                    size={22}
                                                    style={{marginLeft:2}}
                                                    color={selectItem === item ?Theme.theme:Theme.assistFontColor}
                                                />
                                        </View>
                                    </View>
                                </TouchableHighlight>
                            )
                          })
                       }
                    })
                }
            </ScrollView >:null
        )
    }

    render() {
        const { visible } = this.state;
        return (
            <Modal visible={visible} transparent>
                <TouchableHighlight style={{ flex: 1 }} underlayColor='transparent' onPress={() => this.setState({ visible: false, data: null })}>
                    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}></View>
                </TouchableHighlight>
                <View style={{ backgroundColor:'#fff' }}>
                    <View style={{ padding: 10, borderBottomColor: Theme.lineColor, borderBottomWidth: 1, alignItems: 'center' }}>
                        <CustomText text='根据公司差旅政策，推荐您预订低价航班' style={{ fontSize: 16 }} />
                    </View>
                    {this._renderList()}
                    {/* <View style={{ height: 60, borderColor: Theme.lineColor, borderTopWidth: 1, flexDirection: 'row' }}>
                        <TouchableHighlight underlayColor='transparent' style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={this._orderLowPriceOperation}>
                            <CustomText text='预订所选航班' style={{ color: Theme.theme }} />
                        </TouchableHighlight>
                        <TouchableHighlight underlayColor='transparent' style={{ flex: 1, backgroundColor: Theme.themebg, alignItems: 'center', justifyContent: 'center' }} onPress={this._continuteOrder}>
                            <CustomText text='继续预订原航班' style={{ color: 'white' }} />
                        </TouchableHighlight>
                    </View> */}
                    {
                        ViewUtil.getTwoBottomBtn('预订最低价',this._orderLowPriceOperation,'继续预订原航班',this._continuteOrder)
                    }
                    <View style={{ height: DeviceUtil.is_iphonex() ? 34 : 0 }}></View>
                </View>
            </Modal>
        )
    }
}
