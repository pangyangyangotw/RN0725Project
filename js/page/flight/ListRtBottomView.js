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
import CropImage from '../../custom/CropImage';
import I18nUtil from '../../util/I18nUtil';
import Key from '../../res/styles/Key';
import StorageUtil from '../../util/StorageUtil';
export default class ListRtBottomView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            data: null,
            selectItem: null,
            craftTypeList: []
        }
    }

    componentDidMount() {
        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({
                craftTypeList: result || []
            })
        })
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
                if(jump){
                    compSwitch ?
                    otwThis.push('Flight_compCreatOrderScreen', data)
                    :
                    otwThis.push('FlightOrderScreeb', data);
                }else{
                    otwThis.push('FlightRuleScreen', this.state.data);
                }
                
            } else { 
                if(jump){
                    compSwitch ?
                    otwThis.push('Flight_compCreatOrderScreen', data)
                    :
                    otwThis.push('FlightOrderScreeb', data);
                }else{
                    otwThis.push('FlightRtRule', this.state.data);
                }
            }
        })
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
        const { data, selectItem, craftTypeList } = this.state;
        if (!data || !data.MatchTravelRules || !data.MatchTravelRules.unmatchlist || !data.MatchTravelRules.unmatchlist[0] || !data.MatchTravelRules.unmatchlist[0].LowPriceFights) return;
        return (
            <ScrollView style={{height:data.MatchTravelRules.unmatchlist[0].LowPriceFights.length > 6 ? 500 : null}} keyboardShouldPersistTaps='handled'>
                {
                    data.MatchTravelRules.unmatchlist.map((list, index) => {
                       if(list.LowPriceFights){
                        return list.LowPriceFights.map(obj=>{
                            let item = obj;
                            if (!item) return null;
                            let goDepart = Util.Date.toDate(item.DepartureTime).format('HH:mm');
                            let arrivalDepart = Util.Date.toDate(item.ArrivalTime).format('HH:mm');
    
                            let DepartureAirportDesc = item.DepartureAirportDesc;
                            let ArrivalAirportDesc = item.ArrivalAirportDesc;
                            let planType = Util.Read.planType(item.AirEquipType, craftTypeList);
                            if ((DepartureAirportDesc&&DepartureAirportDesc.includes('航站楼')) || (ArrivalAirportDesc&&ArrivalAirportDesc.includes('航站楼'))) {
                                DepartureAirportDesc = DepartureAirportDesc.replace('航站楼', '');
                                ArrivalAirportDesc = ArrivalAirportDesc.replace('航站楼', '');
                            }
                            return (
                                <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectJourney.bind(this, item)}>
                                    <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
                                        <MaterialIcons
                                            name={selectItem === item ? 'check-box' : 'check-box-outline-blank'}
                                            size={20}
                                            color={selectItem === item ?Theme.theme:Theme.darkColor}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: "space-around" }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                                                    <View style={{ alignItems: "center" }}>
                                                        <CustomText text={goDepart} style={{ fontSize: 18 }} />
                                                        <CustomText text={Util.Parse.isChinese() ? (item.DepartureAirportDesc) : item.DepartureAirport} style={{ fontSize: 14, color: 'gray', marginTop: 5 }} />
                                                    </View>
                                                    <View style={{ alignItems: "center", justifyContent: 'center' }}>
                                                        {
                                                            item.fltInfo && item.fltInfo.Stop > 0 ?
                                                            <CustomText style={{ marginTop: 10,fontSize: 10,borderColor: Theme.theme, color: Theme.theme,borderWidth: 0.5,padding: 2}}  text={'经停'} />
                                                                : <CustomText style={{ marginTop: 5 }} />
                                                        }
                                                                
                                                        <Image source={require('../../res/image/flight_flight_to.png')} style={{ width: 50, height: 5, alignItems: "center", marginLeft: 5, marginRight: 5}} />
                                                        {/* <CustomText text={FlightDuration} style={{ marginTop: 5, fontSize: 12, color: Theme.aidFontColor }} /> */}
                                                    </View>
                                                    {/* <Image source={require('../../res/image/flight_flight_to.png')} style={{ width: 50, height: 5, alignItems: "center", marginLeft: 5, marginRight: 5 }} /> */}
                                                    <View style={{ alignItems: 'center' }}>
                                                        <CustomText text={arrivalDepart} style={{ fontSize: 18 }} />
                                                        <CustomText text={Util.Parse.isChinese() ? item.ArrivalAirportDesc : item.ArrivalAirport} style={{ fontSize: 14, color: 'gray', marginTop: 5 }} />
                                                    </View>
                                                </View>
                                                <CustomText text={'¥' + item.Price} style={{ fontSize: 18, color: Theme.theme, marginLeft: 5 }} />
                                            </View>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 5 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <CropImage code={item.AirCode} />
                                                    <CustomText style={{ marginLeft: 5, marginTop: 5, height: 15, fontSize: 12, color: 'gray', textAlign: 'center' }} text={(Util.Parse.isChinese() ? item.AirCodeDesc : '') + ' ' + item.AirCode + ' ' + item.FlightNumber + '|' + planType} />
                                                </View>
                                                {/* <CustomText text='退改规则' style={{ color: "#6DC17F" }} onPress={this._lowRuleBtnClick.bind(this, item)} /> */}
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
                <View style={{ backgroundColor: 'white' }}>
                    <View style={{ padding: 10, borderBottomColor: Theme.lineColor, borderBottomWidth: 1, alignItems: 'center' }}>
                        <CustomText text='根据公司差旅政策，推荐您预订低价航班' style={{ fontSize: 16 }} />
                    </View>
                    {this._renderList()}
                    <View style={{marginTop:20}}></View>
                    <View style={{  borderColor: Theme.lineColor, borderWidth: 1, flexDirection: 'row',backgroundColor:'#fff',padding:6}}>

                        <TouchableHighlight underlayColor='transparent' style={{ flex: 1, alignItems: 'center', justifyContent: 'center',borderRadius:4,borderWidth:1,marginRight:2,borderColor:Theme.theme,height: 44 }} onPress={this._orderLowPriceOperation}>
                            <CustomText text='预订最低价' style={{ color: Theme.theme }} />
                        </TouchableHighlight>
                        <TouchableHighlight underlayColor='transparent' style={{ flex: 1, backgroundColor: Theme.theme, alignItems: 'center', justifyContent: 'center',borderRadius:4,marginLeft:2,height: 44 }} onPress={this._continuteOrder}>
                            <CustomText text='继续预订原航班' style={{ color: 'white' }} />
                        </TouchableHighlight>
                    </View>
                    <View style={{ height: DeviceUtil.is_iphonex() ? 34 : 0 }}></View>
                </View>
            </Modal>
        )
    }
}