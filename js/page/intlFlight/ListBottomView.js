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
export default class ListBottomView extends React.Component {

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
                // otwThis.push('IntFlightRtRuleScreen', data);
                
                if(data.ViolationRules && data.ViolationRules.length>0){
                    otwThis.push('IntFlightRtRuleScreen', data);
                }else{
                    this._convertToOrder(data.journey,data.backRuleModel,data.backRuleModelArr,data);
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
        this.order = {
            DepartureNationalCode: data.queryModel.DepartureNationalCode,
            DestinationNationalCode: data.queryModel.DestinationNationalCode,
            Departure: journey.OWFlights.DepartureCityName,  //journey.OWFlights.departurnName,
            DepartureCode: journey.OWFlights.DepartureAirport,
            Destination: journey.OWFlights.ArrivalCityName,//journey.OWFlights.arrivalName,
            DestinationCode: journey.OWFlights.ArrivalAirport,
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
        
        this._processFlights(journey.OWFlights, journey.RTFlights ? 21 : 1, journey.IntlFlightRules, 0);
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
        // if (!data || !data.MatchTravelRules || !data.MatchTravelRules.unmatchlist || !data.MatchTravelRules.unmatchlist[0] || !data.MatchTravelRules.unmatchlist[0].LowPriceFights) return;
        return (
            <ScrollView style={{height:data?.LowPriceFights.length >= 5 ? 500 : null}} keyboardShouldPersistTaps='handled'>
                {
                    data?.MatchTravelRules?.unmatchlist?.map((list, index) => {
                       if(list.LowPriceFights){
                        return list.LowPriceFights.map(obj=>{
                            let item = obj;
                            let journeysItem = item.Journeys[0]
                            if (!item) return null;
                            let FlightSegment0 = journeysItem.FlightSegments[0] 
                            let goDepart = `${FlightSegment0.DepartureTime.split('T')[1].slice(0, -3)}`                     
                            let arrivalDepart = `${FlightSegment0.ArrivalTime.split('T')[1].slice(0, -3)}`
                            let DepartureAirport0 = FlightSegment0.DepartureAirportName+" "+FlightSegment0.DepartureTerminal
                            let DepartureAirport1 = FlightSegment0.ArrivalAirportName+" "+FlightSegment0.ArrivalTerminal

                            let DepartDate = item.DepartureTime.split('T')[0].slice(-5)
                            let flights = item.Journeys&&item.Journeys[0]&&item.Journeys[0].FlightSegments
                            let ChangeAir = item.Journeys&&item.Journeys[0]&&item.Journeys[0].FlightSegments&&item.Journeys[0].FlightSegments.length > 1 ? true : false
                            let ArrivalCityEnName = '';
                            let DepartureAirport = '';
                            let ArrivalAirport = ''
                            if(flights.length > 0){
                                airPortData&&airPortData.map((item)=>{
                                    if(item.AirportCode == flights[0]['DepartureAirport']){
                                        // ArrivalCityEnName = item.CityEnName
                                        DepartureAirport = item.AirportEnName
                                    }
                                    if(item.AirportCode == flights[0]['ArrivalAirport']){
                                        ArrivalCityEnName = item.CityEnName
                                    }
                                    if(item.AirportCode == flights[flights.length - 1]['ArrivalAirport']){
                                        ArrivalAirport = item.AirportEnName
                                    }
                                })
                            }

                            return (
                                <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectJourney.bind(this, item)}>
                                    <View style={{ flexDirection: 'row', marginHorizontal: 10, alignItems: 'center',backgroundColor:'#fff',marginTop:10,paddingHorizontal:12,paddingVertical:24, borderRadius:6 }}>
                                        <MaterialIcons
                                            name={selectItem === item ? 'check-box' : 'check-box-outline-blank'}
                                            size={18}
                                            color={selectItem === item ? Theme.theme : Theme.darkColor}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: "space-around",alignItems:'center'}}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                                                    <View style={{ justifyContent: 'flex-start',width:80 }}>
                                                        <CustomText text={goDepart} style={{ fontSize: 20,fontWeight:'bold' }} />
                                                        <CustomText text={Util.Parse.isChinese()? DepartureAirport0: DepartureAirport} style={{ fontSize: 12, color: 'gray', marginTop: 5 }} />
                                                    </View>
                                                    {
                                                        ChangeAir?
                                                        <View style={{ alignItems: 'center' }}>
                                                            <CustomText text={journeysItem.Duration} style={{fontSize:10}}></CustomText>
                                                            <Image style={{ height: 3, width: 60 }} source={require('../../res/Uimage/arrow.png')} />
                                                            <View style={{flexDirection:'row',marginTop:2}}>
                                                                <CustomText style={{ fontSize: 10, borderColor: Theme.theme, color: Theme.theme, borderWidth: 0.5}} text='转' />
                                                                <CustomText style={{ fontSize: 10, color: Theme.theme }} 
                                                                    text={Util.Parse.isChinese() ? flights[0]['ArrivalCityName'] : ArrivalCityEnName}                                         
                                                                />
                                                            </View>
                                                        </View>
                                                        :
                                                        <View style={{ alignItems: "center", justifyContent: 'center' }}>
                                                            {
                                                                item.fltInfo && item.fltInfo.Stop > 0 
                                                                ?
                                                                <Image source={Util.Parse.isChinese() ? require('../../res/Uimage/flightFloder/_zstop.png') : require('../../res/Uimage/flightFloder/_estop.png')} style={{ width: 60, height: 10 }}></Image>
                                                                :
                                                                <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                                                            }
                                                        </View>
                                                    }
                                                    
                                                    <View style={{ justifyContent: 'flex-end',width:80 }}>
                                                        <CustomText text={arrivalDepart} style={{  fontSize: 20,textAlign:'right',fontWeight:'bold'}} />
                                                        <CustomText text={Util.Parse.isChinese() ? DepartureAirport1 : ArrivalAirport} style={{ fontSize: 12, color: 'gray', marginTop: 5,textAlign:'right' }} />
                                                    </View>
                                                </View>
                                                <View style={{alignItems:'center'}}>
                                                    <CustomText text={'¥' + item.AdtPrice} style={{ fontSize: 18, color: Theme.theme, marginLeft: 5 }} />
                                                    <View style={{flexDirection:'row'}}>
                                                        <CustomText text={'税'} style={{ fontSize: 12,color: Theme.assistFontColor, marginLeft: 5 }} />
                                                        <CustomText text={'¥' + item.PriceList[0].Tax} style={{ fontSize: 13,color: Theme.assistFontColor }} />
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <CustomText style={{ marginLeft: 8,  height: 15, fontSize: 12, color: 'gray', textAlign: 'center' }} text={(Util.Parse.isChinese() ? item.TicketingCarrierName : '') + ' | ' + item.TicketingCarrier + FlightSegment0.FlightNumber + ' | ' } />
                                                    <CustomText style={{ marginLeft: 8,  height: 15, fontSize: 12, color: 'gray', textAlign: 'center' }} 
                                                                text={DepartDate} />
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    
                                </TouchableHighlight>
                            )
                          })
                       }
                    })
                }
            </ScrollView >
        )
    }

    render() {
        const { visible } = this.state;
        return (
            <Modal visible={visible} transparent>
                <TouchableHighlight style={{ flex: 1 }} underlayColor='transparent' onPress={() => this.setState({ visible: false, data: null })}>
                    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}></View>
                </TouchableHighlight>
                <View style={{ backgroundColor: Theme.normalBg }}>
                    <View style={{padding: 10, borderBottomColor: Theme.lineColor, borderBottomWidth: 1, alignItems: 'center' }}>
                        <CustomText text='根据公司差旅政策，推荐您预订低价航班' style={{ fontSize: 16 }} />
                    </View>
                    {this._renderList()}
                    <View style={{marginTop:20}}></View>
                    <View style={{ borderColor: Theme.lineColor, borderWidth: 1, flexDirection: 'row',backgroundColor:'#fff',padding:10 }}>

                        <TouchableHighlight underlayColor='transparent' style={{ flex: 1, alignItems: 'center', justifyContent: 'center',borderRadius:4,borderWidth:1,marginRight:5,borderColor:Theme.theme,height: 44, }} onPress={this._orderLowPriceOperation}>
                            <CustomText text='预订最低价' style={{ color: Theme.theme ,fontSize: 16 }} />
                        </TouchableHighlight>
                        <TouchableHighlight underlayColor='transparent' style={{ flex: 1, backgroundColor: Theme.theme, alignItems: 'center', justifyContent: 'center',borderRadius:4,marginLeft:5,height: 44 }} onPress={this._continuteOrder}>
                            <CustomText text='继续预订原航班' style={{ color: 'white',fontSize: 16 }} />
                        </TouchableHighlight>
                    </View>
                    <View style={{ height: DeviceUtil.is_iphonex() ? 34 : 0 }}></View>
                </View>
            </Modal>
        )
    }
}