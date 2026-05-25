import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableHighlight
} from 'react-native';
import SuperView from '../../super/SuperView';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Util from '../../util/Util';
import TrainEnum from '../../enum/TrainEnum';
import I18nUtil from '../../util/I18nUtil';
export default class TrainChangeTicketDetailScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '选择席位'
        }
    }
    /**
     *  展示经停数据
     */
    _trainStopStations = () => {
        this.params.ticket.departureDate = this.params.departureDate.format('yyyy-MM-dd', true);
        this.push('TrainStopStation', this.params.ticket);
    }
    /**
     *  展示预订须知
     */
    _alertNotice = () => {
        // this.showAlertView(Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en);
        const { ticket } = this.params;
        let _alertA = Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en
        let _alertB = Util.Parse.isChinese() ? TrainEnum.trainOrderNoticeGSG.cn : TrainEnum.trainOrderNoticeGSG.en
        this.showAlertView( (ticket.from_station_code==="XJA" || ticket.to_station_code==="XJA") ? _alertB : _alertA );
    }

    /**
     *  预订
     */
    _trainReserve = (item) => {
        const { ticket, reissueOrder, departureDate, feeType } = this.params;
        if (item && item.seatCount > 0) {
            if (ticket.ViolationMode === 1 && item.checkSeat === 0) {
                this.toastMsg('超标禁止预订');
                return;
            }
            // if (reissueOrder) {
            //     let oldDep = Util.Date.toDate(reissueOrder.TrainInfo.DepartureTime);
            //     let twoLaterDate = new Date().addDays(2);
            //     let oldArrivalStation = reissueOrder.TrainInfo.ToStationName;
            //     if (oldArrivalStation.slice(0, 2) === ticket.to_station_name.slice(0, 2)) {
            //         let oldLastTime = new Date(oldDep.getFullYear(), oldDep.getMonth(), oldDep.getDate(), '24', '00', '00');
            //         let departureTime = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd')} ${ticket.start_time}`)
            //         if (twoLaterDate >= oldDep && new Date().format('yyyy-MM-dd') !== oldDep.format('yyyy-MM-dd') && oldLastTime <= departureTime) {
            //             this.toastMsg('由于铁路局规定，您的车票只能改签到票面日期当日以及票面日前之前的列车');
            //             return;
            //         }
            //     }
            // }
            ticket.selectedSeat = item;
            ticket.departureDate = departureDate;
            this.push('TrainOrderReissueScreen', {
                    ticket,
                    reissueOrder: reissueOrder,
                });
        } else {
            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}已售完，请选择其他票种', I18nUtil.translate(item.seat)));
        }
    }

    _renderTrainInfo = () => {
        const { ticket, departureDate } = this.params;
        let departureTime = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd')} ${ticket.start_time}`);
        let destinationTime = Util.Date.toDate(`${departureTime.addDays(+ticket.arrive_days).format('yyyy-MM-dd')} ${ticket.arrive_time}`);

        return (
            <View>
                <View style={{ flexDirection: 'row', backgroundColor: Theme.theme, padding: 20 }}>
                    <View style={{ flex: 1, justifyContent: 'space-around' }}>
                        <CustomText style={curStyle.detailMainFont} numberOfLines={1} text={ticket.from_station_name} />
                        <CustomText style={curStyle.detailTimeFont} text={ticket.start_time} />
                        <CustomText style={curStyle.detailAidFont} text={(departureTime && departureTime.format('MM-dd')) + departureTime.getWeek()} />
                    </View>
                    <View style={[{ flex: 1 }, curStyle.center]}>
                        <CustomText style={curStyle.detailMainFont} text={ticket.train_code} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                            <View style={{ flexDirection: 'row-reverse', height: 1, width: 15, backgroundColor: 'white' }}></View>
                            <View style={[{ borderColor: 'white', borderWidth: 1, borderRadius: 2, padding: 2 }, curStyle.center]}>
                                <CustomText allowFontScaling={false} style={{ color: 'white' }} text={ticket.runTimeDesc} />
                            </View>
                            <View style={{ height: 1, width: 15, backgroundColor: 'white' }}></View>
                        </View>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'space-around', alignItems: 'flex-end' }}>
                        <CustomText style={[curStyle.detailMainFont, { alignItems: 'flex-end' }]} numberOfLines={1} text={ticket.to_station_name} />
                        <CustomText style={[curStyle.detailTimeFont, { alignItems: 'flex-end' }]} text={ticket.arrive_time} />
                        <CustomText style={[curStyle.detailAidFont, { alignItems: 'flex-end' }]} text={(destinationTime && destinationTime.format('MM-dd')) + destinationTime.getWeek()} />
                    </View>
                    <View style={{ width: 18 }}>
                        <CustomText style={{ color: 'white', fontSize: 12, marginTop: 15 }} text={ticket.arrive_days > 0 ? '+' + ticket.arrive_days : ''} />
                    </View>
                </View>
                <View style={{ backgroundColor: "white", flexDirection: 'row', justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center" }}>
                        <CustomText style={{ fontSize: 14, marginRight: 5, color: 'gray' }} text='经停站' onPress={this._trainStopStations} />
                        <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center" }}>
                        <CustomText style={{ fontSize: 14, marginRight: 5, color: 'gray' }} text='预订须知' onPress={this._alertNotice} />
                        <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                    </View>
                </View>
            </View>
        )
    }
    _renderTicketTypes = () => {
        let { ticket, feeType } = this.params;
        let list = ticket.ticketTypes;
        return list.map((item, index) => {
            return (
                <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 15, backgroundColor: 'white', marginBottom: 1, alignItems: 'center' }} key={index}>
                    <CustomText style={[{ flex: 1 }, curStyle.mainFont]} text={item.seat} />
                    <CustomText style={[{ flex: 1, color: '#ff7a03' }, curStyle.mainFont]} text={'¥' + item.price} />
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <CustomText style={[curStyle.mainFont]} text={item.seatCount} />
                        <CustomText style={[curStyle.mainFont]} text='张' />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row-reverse' }}>
                        <TouchableHighlight style={ticket.ViolationMode == 1 && item.checkSeat == 0 && feeType == 1 ? curStyle.btnEnable : curStyle.btn} activeOpacity={1} underlayColor='#D16403' disabled={ticket.ViolationMode == 1 && item.checkSeat == 0 && feeType == 1 ? true : false} onPress={this._trainReserve.bind(this, item)}>
                            <CustomText style={{ color: 'white' }} text='预订' />
                        </TouchableHighlight>
                        {item.checkSeat == 0 && feeType == 1 ? <CustomText style={{ fontSize: 9, color: 'red', marginRight: 5, flex: 1 }} text='超标' /> : null}
                    </View>
                </View>
            );
        });
    }

    renderBody() {
        return (
            <View style={{ flex: 1 }}>
                {this._renderTrainInfo()}
                <ScrollView style={{ flex: 1, marginTop: 10 }} keyboardShouldPersistTaps='handled'>
                    {this._renderTicketTypes()}
                </ScrollView>
            </View>
        )
    }
}
const curStyle = StyleSheet.create({
    detailMainFont: {
        color: 'white'
    },
    detailAidFont: {
        color: 'white',
        fontSize: 12
    },
    detailTimeFont: {
        color: 'white',
        fontSize: 25
    },
    mainFont: {
        fontSize: 16
    },
    btn: {
        backgroundColor: '#ff7a03',
        borderRadius: 2,
        width: 50,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnEnable: {
        backgroundColor: 'gray',
        borderRadius: 2,
        width: 50,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    }
});