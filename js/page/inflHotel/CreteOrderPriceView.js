import React from 'react';
import {
    View,
    Animated,
    Platform,
    Dimensions,
    StyleSheet,
    Easing,
    ScrollView
} from 'react-native';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';

import DeviceUtil from '../../util/DeviceUtil';
import Util from '../../util/Util';
export default class CreateOrderPriceView extends React.Component {



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
    _seriveprice = (merchantPrice) => {
        const {roomModel, liveDay, roomCount,ServiceFeesData,travellers} = this.props;
        if(!ServiceFeesData){return}
        var serviceFee = 0;
        var VipServiceFee = 0;
        var servicePrice = 0
        let vip = 0;
        let pub = 0;
        var personList = [];
        travellers.forEach(item => {
            // item.map((obj)=>{
            //    personList.push(obj);
            // })
            personList.push(item);
        })
        personList.forEach((item)=>{
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        ServiceFeesData&&ServiceFeesData.ServiceFees&&ServiceFeesData.ServiceFees.map((item)=>{//非VIP
            if (item.FeeValueType == 1) {
                serviceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                serviceFee += item.Price;
            }
        }) 
        ServiceFeesData&&ServiceFeesData.VipServiceFees&&ServiceFeesData.VipServiceFees.map((item)=>{//VIP
            if (item.FeeValueType == 1) {
                VipServiceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                VipServiceFee += item.Price;
            }
        }) 
        
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
        let service = merchantPrice + servicePrice

        return (
            ServiceFeesData.IsShowServiceFee?<View>
                {
                    <View style={styles.row}>
                        <CustomText text={'服务费'} />
                        <View>
                            <CustomText text={'￥'+service.toFixed(2)} style={{ color: Theme.theme}} />
                        </View>
                    </View>
                }
                 {
                    vip > 0 ? 
                    ServiceFeesData&&ServiceFeesData.VipServiceFees&&ServiceFeesData.VipServiceFees.map((obj,index)=>{
                         let amount;
                         if (obj.FeeValueType == 1) {
                            amount = Number(obj.Price);
                        }
                        else if (obj.FeeValueType == 2) {
                           amount= Number((obj.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                        }
                        if(ServiceFeesData.TollType===1){//按夜间收
                            // if(vip>0){
                                amount = amount * liveDay * roomCount
                        }else if(ServiceFeesData.TollType===2){//按订单收取
                           
                        }else if(ServiceFeesData.TollType===3){//按房间收取
                            // if(vip>0){
                                amount = amount * roomCount
                            // }else{
                            //     servicePrice = serviceFee * roomCount
                            // }
                        }
                        return (
                            <View style={styles.row}>
                            <CustomText text={'  ' + (Util.Parse.isChinese() ? obj.Name : obj.EnName)} />
                            <View>
                                <CustomText text={'¥' + amount } style={{ color: Theme.theme }}/>
                            </View>
                        </View>
                        )
                    }):
                    ServiceFeesData&&ServiceFeesData.VipServiceFees&&ServiceFeesData.ServiceFees.map((obj,index)=>{
                        let amount;
                        if (obj.FeeValueType == 1) {
                           amount = Number(obj.Price);
                       }
                       else if (obj.FeeValueType == 2) {
                          amount= Number((obj.FeeValue * roomModel.AvgPrice* liveDay).toFixed(2));
                       }
                       if(ServiceFeesData.TollType===1){//按夜间收
                           // if(vip>0){
                               amount = amount * liveDay * roomCount
                       }else if(ServiceFeesData.TollType===2){//按订单收取
                          
                       }else if(ServiceFeesData.TollType===3){//按房间收取
                           // if(vip>0){
                               amount = amount * roomCount
                           // }else{
                           //     servicePrice = serviceFee * roomCount
                           // }
                       }
                       return (
                           <View style={styles.row}>
                           <CustomText style={{marginLeft:20,width:240}} text={ (Util.Parse.isChinese() ? obj.Name : obj.EnName)} />
                           <View>
                               <CustomText text={'¥' + amount } />
                           </View>
                       </View>
                       )
                   })
                }
            </View>:null
        )
    }


    render() {
        const { visible } = this.state;
        const { roomModel, liveDay, roomCount, RcModel, paymentDesc, merchantPrice,ServiceFeesData } = this.props;
        if (!visible) return null;
        let companyCost = 0;
        let companyCost2 = 0;
        let _avgPrice = roomModel.CurrencyInfo&&roomModel.CurrencyInfo.PriceList.AvgPrice?roomModel.CurrencyInfo.PriceList.AvgPrice:null
        if (RcModel && RcModel.ViolationMode == 3 && parseFloat(RcModel.PriceLimit) < roomModel.AvgPrice) {
            companyCost = RcModel.PriceLimit * liveDay * roomCount;
        }else{
            companyCost2 = _avgPrice * liveDay * roomCount;
            companyCost = roomModel.AvgPrice * liveDay * roomCount;
        }
        return (
            <View style={[styles.view, { width: screenWidth, height: DeviceUtil.is_iphonex() ? screenHeight - 84 : screenHeight - 54 }]}>
                <Animated.View style={{ height: this.state.height, backgroundColor: 'white' }}>
                    <View>
                    <ScrollView>
                    <View style={styles.row}>
                        <CustomText text={paymentDesc} />
                        {
                            _avgPrice?
                            <View>
                                <View style= {{flexDirection:'row'}} >
                                    <CustomText text={companyCost2.toFixed(2)} style={{ color: Theme.theme }} />
                                    <CustomText text={roomModel.CurrencyInfo?.Currency ? roomModel.CurrencyInfo.Currency:''} style={{ color: Theme.theme ,fontSize:12,marginLeft:3,marginTop:3}} />
                                    {/* RcModel.CurrencyInfo&&RcModel.CurrencyInfo.PriceList.AvgPrice? */}
                                </View>
                                {
                                    roomModel.CurrencyInfo.Currency==='CNY'?null:<CustomText text={'≈'+'CNY'+companyCost.toFixed(2)} style={{ color: Theme.theme }}></CustomText>
                                }                                
                            </View>
                            :
                            <View>
                                <CustomText text={'CNY'+companyCost.toFixed(2)} style={{ color: Theme.theme }}></CustomText>
                            </View>
                        }
                    </View>
                    {
                        this._seriveprice(merchantPrice)
                    }
                    { !ServiceFeesData.IsShowServiceFee || merchantPrice==0 ? null :
                        <View style={[styles.row,{marginLeft:10}]}>
                            <CustomText text='刷卡手续费' />
                            <View>
                                <CustomText text={'¥' + merchantPrice.toFixed(2) } style={{ color: Theme.theme }} />
                            </View>
                        </View>
                    }
                    <View style={styles.row}>
                        <CustomText text='每晚均价' />
                        <View>
                            <CustomText text={'¥' + roomModel.AvgPrice.toFixed(2)} style={{ color: Theme.theme }} />
                        </View>
                    </View>
                    {roomModel.Tax?<View style={styles.row}>
                        <CustomText text='税费' />
                        <View>
                            <CustomText text={'CNY' + roomModel.Tax.toFixed(2)} style={{ color: Theme.theme }} />
                        </View>
                    </View>:null}
                    <CustomText style={{marginLeft:10}} text='每日价格' />
                    {
                        roomModel?.NightlyRates?.map((item, index) => {
                            return (
                                <View style={styles.row}>
                                    <CustomText text={item.Date} />
                                    <View>
                                        <CustomText text={item.CurrencyInfo?.Currency +' '+ item.CurrencyInfo?.PriceList?.Price.toFixed(2)} style={{ color: Theme.theme }} />
                                    </View>
                                </View>
                            )
                        })
                    }
                    <View style={{height:80}}></View>
                    </ScrollView>
                    </View>
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