import React from 'react';
import { Modal, Animated, View, ActivityIndicator, Easing } from 'react-native';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import PropTypes from 'prop-types';
import I18nUtil from '../../util/I18nUtil';
import Util from '../../util/Util';
export default class SumbitOrderTipView extends React.Component {

    static propTypes = {
        goTrip: PropTypes.object.isRequired,
        arrivalTrip: PropTypes.object,
        TravellerList: PropTypes.array.isRequired
    }
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            goCitys: new Animated.Value(0),
            gpCitysOpa:new Animated.Value(0),
            goDate: new Animated.Value(0),
            goDateOpa:new Animated.Value(0),
            goDetail: new Animated.Value(0),
            goDetailOpa: new Animated.Value(0),
            goCitys: new Animated.Value(0),
            goDate: new Animated.Value(0),
            goDetail: new Animated.Value(0),
            passenger: new Animated.Value(0),
            passengerOpa:new Animated.Value(0),
        }

    }

    show = () => {

        this.setState({
            visible: true
        }, () => {
            Animated.parallel([
                Animated.timing(this.state.goCitys, {
                    toValue: 30,
                    duration: 300,
                    easing: Easing.linear
                }),
                Animated.timing(this.state.gpCitysOpa, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.linear
                }),
            ])
            .start(() => {
                this.timer1 = setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(this.state.goDate, {
                            toValue: 30,
                            duration: 300,
                            easing: Easing.linear
                        }),
                        Animated.timing(this.state.goDateOpa, {
                            toValue: 1,
                            duration: 300,
                            easing: Easing.linear
                        })
                    ])
                   .start(() => {
                        this.timer2 = setTimeout(() => {
                            Animated.parallel([
                                Animated.timing(this.state.goDetail, {
                                    toValue: 30,
                                    duration: 300,
                                    easing: Easing.linear
                                }),
                                Animated.timing(this.state.goDetailOpa, {
                                    toValue: 1,
                                    duration: 300,
                                    easing: Easing.linear
                                })
                            ])
                           .start(() => {
                                this.timer3 = setTimeout(() => {
                                    Animated.parallel([
                                        Animated.timing(this.state.passenger, {
                                            toValue: 30,
                                            duration: 300,
                                            easing: Easing.linear
                                        }),
                                        Animated.timing(this.state.passengerOpa, {
                                            toValue: 1,
                                            duration: 300,
                                            easing: Easing.linear
                                        })
                                    ])
                                  .start();
                                }, 300);
                            });
                        }, 300);
                    })
                }, 300);

            })
        })

    }
    hide = () => {
        this.setState({
            visible: false
        })
    }
    componentWillUnmount() {
        this.timer1 && clearTimeout(this.timer1);
        this.timer2 && clearTimeout(this.timer2);
    }

    render() {
        const { visible } = this.state;
        let passener = [];
        if (this.props.TravellerList) {
            this.props.TravellerList.forEach(obj => {
                passener.push(obj.Name);
            })
        }

        return (
            <Modal transparent visible={visible}>
                <Animated.View style={{ backgroundColor: 'rgba(0,0,0,0.6)', flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <View style={{ width: '80%', backgroundColor: 'white', borderRadius: 5, padding: 20 }}>
                        {this._renderTripInfo(this.props.goTrip)}
                        {
                            this.props.arrivalTrip ?
                                this._renderTripInfo(this.props.arrivalTrip)
                                : null
                        }

                        <Animated.View opacity={this.state.passengerOpa} style={{ marginTop: 10, height: this.state.passenger }}>
                            <CustomText text='乘机人' style={{ color: "gray" }} />
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between" }}>
                                <CustomText style={{ fontSize: 16 }} text= {passener.join(',')}/>
                                <AntDesign name={'check'} size={24} color={Theme.theme} />
                            </View>
                        </Animated.View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center", marginTop: 15 }}>
                            <ActivityIndicator />
                            <CustomText style={{ marginLeft: 10, fontSize: 15, color: Theme.aidFontColor }} text='正在生成订单' onPress={this.show} />
                        </View>
                    </View>
                </Animated.View>
            </Modal>
        )
    }
    _renderTripInfo = (data) => {
        const { goCitys, goDate, goDetail,gpCitysOpa,goDateOpa,goDetailOpa } = this.state;
        if (!data) return null;
        let DepartureTime = Util.Date.toDate(data.DepartureTime);
        return (
            <View >
                <Animated.View opacity={gpCitysOpa} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", height: goCitys, }}>
                    <CustomText style={{ fontSize: 16 }} text={I18nUtil.translate(data.DepartureCityName) + ' - ' + I18nUtil.translate(data.ArrivalCityName)} />
                    <AntDesign name={'check'} size={24} color={Theme.theme} />
                </Animated.View>
                <Animated.View opacity={goDateOpa} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", height: goDate }}>
                    <CustomText style={{ fontSize: 16 }} text={DepartureTime.format('yyyy/MM/dd') + ' ' + I18nUtil.translate(Util.Date.getWeekDesc(DepartureTime))} />
                    <AntDesign name={'check'} size={24} color={Theme.theme} />
                </Animated.View>
                <Animated.View opacity={goDetailOpa} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", height: goDetail }}>
                    <CustomText style={{ fontSize: 16 }} text={data.AirCode + data.FlightNumber + ' ' + DepartureTime.format('HH:mm') +' ' + I18nUtil.translate('起飞')} />
                    <AntDesign name={'check'} size={24} color={Theme.theme} />
                </Animated.View>
            </View>
        )
    }
}