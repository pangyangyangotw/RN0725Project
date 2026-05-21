import React from 'react';
import {
    View,
    ScrollView
} from 'react-native';
import SuperView from '../../super/SuperView';
import TrainService from '../../service/TrainService';
import I18nUtil from '../../util/I18nUtil';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
export default class TrainStopStationScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '经停站'
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.state = {
            stopStations: []
        }
    }

    componentDidMount() {
  
        this.showLoadingView();
        let model = {
            TrainNo: this.params.train_no,
            DepartureDate: this.params.departureDate,
            DepartureCode:this.params.from_station_code,
            DestinationCode:this.params.to_station_code,
            TrainCode:this.params.train_code
        }
        TrainService.TrainStopStations(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data) {
                    this.params.trainStopStations = response.data;
                    this.setState({
                        stopStations: response.data
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    renderBody() {

        const { stopStations } = this.state;
        return (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
                <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <CustomText text={this.params.train_code + ' ' + I18nUtil.translate(this.params.trainType)} />
                    <CustomText text={I18nUtil.translate('全程') + this.params.runTimeDesc} />
                </View>
                {
                    stopStations && stopStations.length > 0 ?
                    stopStations.map((item, index) => {
                            return (
                                <View key={item.StationName + index} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 20, borderBottomColor: Theme.lineColor, borderBottomWidth: 0.5, backgroundColor: 'white' }}>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <View style={{ justifyContent: "center", alignItems: 'center', backgroundColor: Theme.theme, width: 24, height: 16, borderRadius: 8 }}>
                                            <CustomText style={{ fontSize: 10, color: 'white' }} text={item.station_no} />
                                        </View>
                                        <CustomText style={{ flex: 1, marginLeft: 5 }} numberOfLines={1} text={ item.station_name} />
                                    </View>
                                    <CustomText style={{ flex: 1 }} text={ index === 0 ? item.start_time : item.arrive_time} />
                                    <CustomText style={{ flex: 1 }} text={I18nUtil.translate('停') + item.stopover_time} />
                                </View>
                            )
                        }) : null
                }
            </ScrollView>
        )
    }
}