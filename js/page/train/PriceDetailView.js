import React from 'react';
import {
    View,
    Animated,
    Platform,
    Dimensions,
    StyleSheet,
    Easing,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import PropTypes from 'prop-types';
import DeviceUtil from '../../util/DeviceUtil';
import Util from '../../util/Util';
export default class PriceDetailView extends React.Component {

    static propTypes = {
        customerInfo: PropTypes.object.isRequired,
        employees: PropTypes.array.isRequired,
        travellers: PropTypes.array.isRequired,
    }

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            height: new Animated.Value(0),
        }
    }
    getVisible() {
        return this.state.visible;
    }
    show() {
        this.setState({
            visible: true
        }, () => {
            Animated.parallel([
                Animated.timing(this.state.height, {
                    toValue: 300,
                    duration: 200,
                    easing: Easing.linear,
                })
            ]).start();
        })
    }
    hide() {
        Animated.parallel([

            Animated.timing(this.state.height, {
                toValue: 0,
                duration: 200,
                easing: Easing.linear,
            })
        ]).start(() => {
            this.setState({
                visible: false
            })
        });

    }


    _seriveprice = () => {
        const { customerInfo, employees ,travellers, ServiceFeesData,TrainPrice,ticket,merchantPrice  } = this.props;
        let vip = 0;
        let pub = 0;
        employees.forEach(item => {
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        travellers.forEach(item => {
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        var serviceFee = 0;
        var VipServiceFee = 0;
        let price = TrainPrice?TrainPrice:ticket.selectedSeat.price
        var baseAmount = price
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
        let servicePrice = merchantPrice + serviceFee
        return (
            ServiceFeesData && ServiceFeesData.IsShowServiceFee ? (
            <View>
                {
                    pub > 0 ?
                    <View>
                        <View style={styles.row}>
                            <CustomText text='服务费' />
                            <View>
                                <CustomText text={'¥' + servicePrice.toFixed(2) + 'X' + pub} style={{ color: Theme.theme }} />
                            </View>
                        </View>
                        {
                                ServiceFeesData && ServiceFeesData.ServiceFees && ServiceFeesData.ServiceFees.map((obj, index) => {
                                    let amout;
                                    if (obj.FeeValueType == 1) {
                                        amout = obj.Price ;
                                    } else if (obj.FeeValueType == 2) {
                                        amout = Number((obj.FeeValue * baseAmount).toFixed(2));
                                    }
                                    if (amout) {
                                        amout = amout.toFixed(2);
                                    }


                                    return (
                                        <View style={styles.row}>
                                            <CustomText text={'  ' + (Util.Parse.isChinese() ? obj.Name : obj.EnName)} />
                                            <View>
                                                <CustomText text={'¥' + amout + 'X' + pub} />
                                            </View>
                                        </View>
                                    )
                                })
                            }
                            {  merchantPrice==0 ? null :
                                <View style={[styles.row,{marginLeft:10}]}>
                                    <CustomText text={'刷卡手续费'} />
                                    <View>
                                        <CustomText text={'¥' + merchantPrice } style={{ color: Theme.theme }} />
                                    </View>
                                </View>
                            }
                        </View>
                        : null
                }
                {
                    vip > 0 ?
                    <View>
                        <View style={styles.row}>
                            <CustomText text='Vip服务费' />
                            <View>
                                <CustomText text={'¥' + VipServiceFee.toFixed(2) + 'X' + vip} style={{ color: Theme.theme }} />
                            </View>
                        </View>
                        {
                                ServiceFeesData && ServiceFeesData.ServiceFees && ServiceFeesData.VipServiceFees.map((obj, index) => {
                                    let amout;
                                    if (obj.FeeValueType == 1) {
                                        amout = obj.Price ;
                                    } else if (obj.FeeValueType == 2) {
                                        amout = Number((obj.FeeValue * baseAmount).toFixed(2));
                                    }
                                    if (amout) {
                                        amout = amout.toFixed(2);
                                    }


                                    return (
                                        <View style={styles.row}>
                                            <CustomText text={'  ' + (Util.Parse.isChinese() ? obj.Name : obj.EnName)} />
                                            <View>
                                                <CustomText text={'¥' + amout + 'X' + vip} />
                                            </View>
                                        </View>
                                    )
                                })
                            }
                   </View>
                        : null
                }
                
            </View>
            ):null
        )
    }

    render() {
        const { visible } = this.state;
        if (!visible) return null;
        const { employees,travellers, ticket, TrainPrice } = this.props;
        let WH = Dimensions.get('window').height;
        return (
            <View style={[styles.view, { width: screenWidth, height: DeviceUtil.is_iphonex() ? (WH - 84):(Platform.OS === 'ios' ? WH-64:WH-30+50) }]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                    this.props.callBack && this.props.callBack();
                }}></TouchableOpacity>
                <Animated.View style={{ height: this.state.height, backgroundColor: 'white' }}>
                    <ScrollView keyboardShouldPersistTaps='handled'>
                    <View style={styles.row}>
                        <CustomText text='车票' />
                        <View>
                           <CustomText text={'¥' + (TrainPrice?TrainPrice:ticket.selectedSeat.price) + 'X' + (employees.length + travellers.length)} style={{ color: Theme.theme }} />
                        </View>
                    </View>
                    {
                        this._seriveprice()
                    }
                    </ScrollView>
                </Animated.View>
            </View>
        )
    }
}



const styles = StyleSheet.create({
    view: {
        position: 'absolute',
        top: DeviceUtil.is_iphonex() ? -88 : (Platform.OS === 'ios' ? -64 : -70),
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',

    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        padding: 10
    }
})