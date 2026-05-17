
import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableHighlight
} from 'react-native';
import SuperView from "../../super/SuperView";
import ViewUtil from '../../util/ViewUtil';
import CheckBox from '../../custom/CheckBox';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Util from '../../util/Util';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';
export default class FlightFilterScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '筛选',
            rightButton: ViewUtil.getRightButton('默认', this._defaultClick)
        }
        // this.params.filter.map((item)=>{
        //     if(item.title === '舱位'){
        //         item.data = this.params.selectCabin?this.params.selectCabin:'不限'
        //     }
        // })
        this.state = {
            isDirect: this.params.isDirect,
            isShare: this.params.isShare,
            sectionList: [],
            filter: Util.Encryption.clone(this.params.filter),
            hasStop:false,
            craftTypeList: []
        }
    }

    componentDidMount() {
        const { data,canbinOption } = this.params;
        this.state.sectionList.push({ title: '起飞时间', data: ['不限', '00:00-06:00', '06:00-12:00', '12:00-18:00', '18:00-24:00'] })
        let goAir = ['不限'];
        let arrivalAir = ['不限'];
        let airLine = ['不限'];
        let hasStop = false;
        if (data) {
            data.forEach(item => {
                let obj = item?.lowPrice[0];
                 if(Number(obj?.fltInfo?.Stop) > 0){
                   hasStop = true;
                 }
                if (goAir.findIndex(air => air.cn === obj.DepartureAirportDesc) === -1) {
                    goAir.push({
                        cn: obj.DepartureAirportDesc,
                        en: obj.DepartureAirportEnDesc
                    })
                }
                if (arrivalAir.findIndex(air => air.cn === obj.ArrivalAirportDesc) === -1) {
                    arrivalAir.push({
                        cn: obj.ArrivalAirportDesc,
                        en: obj.ArrivalAirportEnDesc
                    })
                }
                if (airLine.findIndex(air => air.cn === obj.AirCodeDesc) === -1) {
                    airLine.push({
                        cn: obj.AirCodeDesc,
                        en: obj.AirCodeEnDesc
                    })
                }
            })
        }
        this.state.sectionList.push({ title: '出发机场', data: goAir })
        this.state.sectionList.push({ title: '到达机场', data: arrivalAir })
        this.state.sectionList.push({ title: '航司', data: airLine })
        // this.state.sectionList.push({ title: '舱位', data: ['不限', {cn:'超值经济舱', en:'Y'}, {cn:'商务舱/公务舱', en:'C-J'}, {cn:'头等舱', en:'F'}] })
        this.state.sectionList.push({ title: '舱位', data:canbinOption?canbinOption: ['不限', '经济舱','超值经济舱', '商务舱/公务舱', '头等舱'] })
        this.state.sectionList.push({ title: '机型', data: ['不限', '大型','中型','其他机型'] })
        this.setState({
           hasStop
        });
        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({
                craftTypeList: result || []
            })
        })
    }


    /**
     *  恢复默认
     */
    _defaultClick = () => {

        this.state.filter.forEach(item => {
            if (typeof item.data === 'string') {
                item.data = '不限'
            } else {
                item.data = ['不限'];
            }
        })
        this.setState({});

    }

    _sectionClick = (item) => {
        item.isOpen = !item.isOpen;
        this.setState({})
    }
    _rowBtnClick = (section, item) => {
        const { filter } = this.state;
        let data = filter.find(obj => obj.title === section.title);
        if (typeof data.data === 'string') {
            data.data = item;
        } else {
            if (typeof item === 'string') {
                data.data = ['不限'];
            } else {
                let index = data.data.findIndex(obj => obj === '不限');
                if (index > -1) {
                    data.data.splice(index, 1);
                }
                let index2 = data.data.findIndex(obj => obj.cn === item.cn);
                if (index2 > -1) {
                    data.data.splice(index2, 1);
                    if (data.data.length === 0) {
                        data.data.push('不限');
                    }
                } else {
                    data.data.push(item);
                }
            }       
        }
        this.setState({});
    }
    /**
     *  确定按钮
     */
    _sureBtnClick = () => {
        let old = this.params.filter.find(item => item.title === '舱位');
        let newData = this.state.filter.find(item => item.title === '舱位');
        const { refresh, load } = this.params;
        const { craftTypeList } = this.state;
        let arr = [];
        this.params.data.forEach(item => {
            let journey = item.lowPrice[0];
            let isGoAir = false;
            let isArrivalAir = false;
            let isTime = false;
            let isAirLine = false;
            let isShare = true;
            let isFlightSize = false;
            this.state.filter.forEach(filter => {
                if (filter.title === '出发机场') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.DepartureAirportDesc) {
                            isGoAir = true;
                            break;
                        }
                    }
                }
                if (filter.title === '到达机场') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.ArrivalAirportDesc) {
                            isArrivalAir = true;
                            break;
                        }
                    }
                }
                if (filter.title === '航司') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.AirCodeDesc) {
                            isAirLine = true;
                            break;
                        }
                    }
                }
                if (filter.title === '机型') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data;
                        if (obj === '不限' || obj === Util.Read.planType2(journey.AirEquipType,craftTypeList)) {
                            isFlightSize = true;
                            break;
                        }else if(obj === '其他机型'){
                            if(!(Util.Read.planType2(journey.AirEquipType,craftTypeList) === '大型' || Util.Read.planType2(journey.AirEquipType,craftTypeList) === '中型' )){
                                isFlightSize = true;
                                break;
                            }
                        }
                    }
                }
                if (filter.title === '起飞时间') {
                    if (filter.data === '不限') {
                        isTime = true;
                    } else {
                        const first = filter.data.split('-')[0].split(':')[0];
                        const last = filter.data.split('-')[1].split(':')[0];
                        const hours = Util.Date.toDate(journey.DepartureTime).getHours();
                        if (Number(first) <= hours && hours < Number(last)) {
                            isTime = true;
                        }
                    }
                }
            })
            if (!this.state.isShare) {
                if (journey.fltInfo && journey.fltInfo.codeShareLine) {
                    isShare = false;
                }
            }
            if (isGoAir && isArrivalAir && isTime && isAirLine && isShare && isFlightSize) {
                if (this.state.isDirect) {
                    if (!+journey.fltInfo.Stop) {
                        arr.push(item);
                    }
                } else {
                    arr.push(item);
                }
            }
        })

        let isFilter = false;
        let index = this.state.filter.findIndex(item => {
            return (typeof item.data === 'string' ? item.data !== '不限' : !item.data.includes('不限'));
        });
        if (index > -1) {
            isFilter = true;
        }
        if(this.state.isDirect || !this.state.isShare){
            isFilter = true;
        }
        if (newData.data !== old.data) {
            load(this.state.filter, this.state.isDirect, isFilter,this.state.isShare);
        } else {
            refresh(arr, this.state.filter, this.state.isDirect, isFilter,this.state.isShare);
        }
        this.pop();
    }
    renderBody() {
        const { isDirect, sectionList, filter, isShare ,hasStop} = this.state;
        return (
            <View style={{ flex: 1 }}>
                <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => this.setState({isShare: !isShare })}>
                        <CustomText style={{ marginRight: 5, color: Theme.theme }} text='共享航班' />
                        <CheckBox
                            tintColor={Theme.aidFontColor}
                            isChecked={isShare}
                            onClick={() => this.setState({ isShare: !isShare })}
                        />
                    </TouchableOpacity>
                 {/* {hasStop  ?  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => this.setState({ isDirect: !isDirect })}>
                        <CustomText style={{ marginRight: 5, color: Theme.theme }} text='仅查看直飞' />
                        <CheckBox
                            tintColor={Theme.aidFontColor}
                            isChecked={isDirect}
                            onClick={() => this.setState({ isDirect: !isDirect })}
                        />
                    </TouchableOpacity> :null } */}
                     {<TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => this.setState({ isDirect: !isDirect })}>
                        <CustomText style={{ marginRight: 5, color: Theme.theme }} text='仅查看直飞' />
                        <CheckBox
                            tintColor={Theme.aidFontColor}
                            isChecked={isDirect}
                            onClick={() => this.setState({ isDirect: !isDirect })}
                        />
                    </TouchableOpacity>}
                </View>
                <ScrollView keyboardShouldPersistTaps='handled'>
                    {
                        sectionList.map((section, index) => {
                            return (
                                <View key={index}>
                                    <TouchableHighlight underlayColor='transparent' onPress={this._sectionClick.bind(this, section)}>
                                        <View style={styles.section}>
                                            <CustomText text={section.title} />
                                            <Ionicons name={section.isOpen ? 'chevron-up' : 'chevron-down'} size={24} color={'gray'} />
                                        </View>
                                    </TouchableHighlight>
                                    {
                                        section.isOpen ?
                                            section.data.map((item, key) => {
                                                let data = filter.find(obj => obj.title === section.title);
                                                let isSelect = false;
                                                if (typeof item === 'string') {
                                                    if (typeof data.data === 'string') {
                                                        isSelect = item === data.data;
                                                    } else {
                                                        isSelect = data.data&&data.data.findIndex(sel => {
                                                            return typeof sel === 'string' ? (item === sel) : (sel.cn === item)
                                                        }) > -1
                                                    }
                                                } else {
                                                    if (typeof data.data === 'string') {
                                                        isSelect = item.cn === data.data;
                                                    } else {
                                                        isSelect = data.data.findIndex(sel => {
                                                            return typeof sel === 'string' ? (item.cn === sel) : (sel.cn === item.cn)
                                                        }) > -1
                                                    }
                                                }
                                                return (
                                                    <TouchableHighlight key={key} underlayColor='transparent' onPress={this._rowBtnClick.bind(this, section, item)}>
                                                        <View style={styles.row}>
                                                            <CustomText text={typeof item === 'string' ? item : (Util.Parse.isChinese() ? item.cn : item.en)} />
                                                            {isSelect ? <AntDesign name={'checkcircleo'} size={22} color={Theme.theme} /> : null}
                                                        </View>
                                                    </TouchableHighlight>
                                                )
                                            })
                                            : null
                                    }
                                </View>
                            )
                        })
                    }
                    {
                        ViewUtil.getSubmitButton('确定', this._sureBtnClick)
                    }
                    <View style={{ height: 34 }}></View>
                </ScrollView>
            </View>

        )
    }
}

const styles = StyleSheet.create({
    section: {
        height: 44,
        flexDirection: 'row',
        backgroundColor: "white",
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        borderBottomColor: Theme.lineColor
    },
    row: {
        height: 44,
        backgroundColor: Theme.normalBg,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        borderBottomColor: 'white',
        paddingHorizontal: 10,
    }
})