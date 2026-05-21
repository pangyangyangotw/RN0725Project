import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import PropTypes from 'prop-types';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import I18nUtil from '../../util/I18nUtil';
import DeviceUtil from '../../util/DeviceUtil';
import Util from '../../util/Util';
export default class PriceInfoView extends React.Component {

    static propTypes = {
        customerInfo: PropTypes.object.isRequired,
        employees: PropTypes.array.isRequired,
        travellers: PropTypes.array.isRequired,
        order: PropTypes.object.isRequired,
        mailSendInfo: PropTypes.object.isRequired
    }
    constructor(props) {
        super(props);
        this.state = {
            showPriceDetail: false
        }
    }
    show() {
        this.setState({
            showPriceDetail: true
        })
    }
    hide() {
        this.setState({
            showPriceDetail: false
        })
    }
    render() {
        const { showPriceDetail } = this.state;
        const { customerInfo, employees,travellers, order, mailSendInfo ,ServiceFeesData,merchantPrice} = this.props;
        if(!ServiceFeesData){return}
        const passengerCount = employees.length + travellers.length;

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
        var baseAmount = order.BasePrice + order.Tax
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
            <Modal visible={showPriceDetail} transparent={true} onRequestClose={() => { }}>
                {/* <View style={{ flex: 2, backgroundColor: 'black', opacity: 0.7 }}>
                </View> */}
                <TouchableOpacity style={{ flex: 1,backgroundColor:Theme.touMingColor }} onPress={() => this.setState({ showPriceDetail: false })}></TouchableOpacity>
                
                <View style={{ flex: 1, backgroundColor: 'white', padding: 10, borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
                    <ScrollView keyboardShouldPersistTaps='handled'>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText text='票面' />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text allowFontScaling={false}>¥</Text>
                            <Text allowFontScaling={false} style={{ color: Theme.theme }}>{order.BasePrice}</Text>
                            <Text allowFontScaling={false} style={{ marginLeft: 5 }}>x{passengerCount}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText text='税款' />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text allowFontScaling={false}>¥</Text>
                            <Text allowFontScaling={false} style={{ color: Theme.theme }}>{order.Tax}</Text>
                            <Text allowFontScaling={false} style={{ marginLeft: 5 }}>x{passengerCount}</Text>
                        </View>
                    </View>
                    {
                        ServiceFeesData && ServiceFeesData.IsShowServiceFee ? (
                            <View>
                                    {pub > 0 ? 
                                    <View>
                                         <View style={{flexDirection: 'row',justifyContent: 'space-between', marginBottom: 10}}>
                                               <CustomText text='服务费' />
                                            <View style={{ flexDirection: 'row'}}>
                                                <Text allowFontScaling={false}>¥</Text>
                                                <Text allowFontScaling={false} style={{ color: Theme.theme }}>{servicePrice.toFixed(2)}</Text>
                                                <Text allowFontScaling={false} style={{ marginLeft: 5 }}>x{pub}{I18nUtil.translate('人')}</Text>
                                            </View> 
                                        </View>
                                        {
                                ServiceFeesData && ServiceFeesData.ServiceFees && ServiceFeesData.ServiceFees.map((obj, index) => {
                                    let amout;
                                    if (obj.FeeValueType == 1) {
                                        amout = obj.Price ;
                                    } else if (obj.FeeValueType == 2) {
                                      amout= Number((obj.FeeValue * baseAmount).toFixed(2));
                                    }   
                                    if (amout) {
                                        amout = amout.toFixed(2);
                                    }


                                    return (
                                        <View style={{ flexDirection: 'row',justifyContent:"space-between"}}>
                                            <CustomText text={(Util.Parse.isChinese() ? obj.Name : obj.EnName)} style={{color:Theme.assistFontColor}}/>
                                            <View>
                                                <CustomText text={'¥' + amout + 'X' + pub} style={{color:Theme.assistFontColor}}/>
                                            </View>
                                        </View>
                                    )
                                })
                            }
                                        </View>
                                        : null
                                    }
                                    {vip ? 
                                    <View>
                                     <View style={{flexDirection: 'row',justifyContent: 'space-between'}}>
                                     <CustomText text='Vip服务费' />
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text allowFontScaling={false}>¥</Text>
                                            <Text allowFontScaling={false} style={{ color: Theme.theme }}>{VipServiceFee.toFixed(2)}</Text>
                                            <Text allowFontScaling={false} style={{ marginLeft: 5 }}>x{vip}{I18nUtil.translate('人')}</Text>
                                        </View> 
                                    </View>
                                    {
                                ServiceFeesData && ServiceFeesData.ServiceFees && ServiceFeesData.VipServiceFees.map((obj, index) => {
                                    let amout;
                                    if (obj.FeeValueType == 1) {
                                        amout = obj.Price ;
                                    } else if (obj.FeeValueType == 2) {
                                      amout= Number((obj.FeeValue * baseAmount).toFixed(2));
                                    }   
                                    if (amout) {
                                        amout = amout.toFixed(2);
                                    }


                                    return (
                                        <View style={{ flexDirection: 'row',justifyContent:"space-between"}}>
                                            <CustomText text={(Util.Parse.isChinese() ? obj.Name : obj.EnName)} style={{color:Theme.assistFontColor}}/>
                                            <View>
                                                <CustomText text={'¥' + amout + 'X' + vip} style={{color:Theme.assistFontColor}}/>
                                            </View>
                                        </View>
                                    )
                                })
                            }
                                    </View>
                                     : null}
                                
                            </View>
                        ) : null
                    }
                    {  merchantPrice==0 ? null :
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: "space-between",
                            padding: 10,
                            marginLeft:10,
                        }}>
                            <CustomText text='刷卡手续费' />
                            <View>
                                <CustomText text={'¥' + merchantPrice } style={{ color: Theme.theme }} />
                            </View>
                        </View>
                    }
                    {
                        mailSendInfo.sendType && mailSendInfo.sendType.MailingMethod != 1 ? (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <CustomText text='邮寄费' />
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text allowFontScaling={false}>¥</Text>
                                    <Text allowFontScaling={false} style={{ color: '#ff7a03' }}>{customerInfo ? customerInfo.Setting.ExpressPrice : 0}</Text>
                                </View>
                            </View>
                        ) : null
                    }
                    </ScrollView>
                </View>
                <TouchableOpacity style={{ height: DeviceUtil.is_iphonex() ? 83 : 50 }} onPress={() => this.setState({ showPriceDetail: false })}>
                    <View></View>
                </TouchableOpacity>
            </Modal>
        );
    }
}