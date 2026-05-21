
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableHighlight,
    Image
} from 'react-native';
import Theme from '../../res/styles/Theme';
import PropTypes from 'prop-types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomText from '../../custom/CustomText';
import Util from '../../util/Util';
import TrainEnum from '../../enum/TrainEnum';
import ViewUtil from '../../util/ViewUtil';
import Feather from 'react-native-vector-icons/Feather';
export default class HeaderView extends React.Component {

    static propTypes = {
        ticket: PropTypes.object.isRequired,
        otwThis: PropTypes.object.isRequired,
        titleTxt: PropTypes.string
    }

    constructor(props) {
        super(props);
        this.state = {
            showTrainDetail: true
        }
    }

    _showRules = () => {
        const { otwThis,ticket } = this.props;
        let _alertA = Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en
        let _alertB = Util.Parse.isChinese() ? TrainEnum.trainOrderNoticeGSG.cn : TrainEnum.trainOrderNoticeGSG.en
        otwThis.showAlertView( (ticket.from_station_code==="XJA" || ticket.to_station_code==="XJA") ? _alertB : _alertA );
    }



    render() {
        const { train_code, from_station_name, to_station_name, start_time, arrive_time, runTimeDesc, selectedSeat, arrive_days, departureDate } = this.props.ticket;
        const {cityList,ticket} = this.props;
        const { showTrainDetail } = this.state;
        cityList&&cityList.map((_item)=>{
            if(_item.Code == ticket.from_station_code){
                ticket.FromStationEnName = _item.EnName
            }else if(_item.Code == ticket.to_station_code){
                ticket.ToStationEnName = _item.EnName
            }
        })
        return (
            <View style={{ margin: 10,borderRadius:6 }}>
                <View style={{ backgroundColor: 'white', borderRadius: 6,padding:10 }}>
                    <TouchableHighlight onPress={() => this.setState({ showTrainDetail: !showTrainDetail })} underlayColor='transparent'>
                        <View style={{ padding: 5, flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: '#f3f3f3', borderBottomWidth: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexDirection: 'row' }}>
                                {
                                    this.props.titleTxt ?
                                        <View style={curStyle.lostyle} >
                                            <CustomText text={this.props.titleTxt} style={{ color: 'white' }} />
                                        </View> : null
                                }
                                <Text allowFontScaling={false} >{departureDate && departureDate.format('yyyy-MM-dd')} {departureDate.getWeek()}</Text>
                            </View>
                            <TouchableOpacity onPress={this._showRules}>
                                <CustomText style={{ color: Theme.theme, fontSize: 12 }} text='预订须知' />
                            </TouchableOpacity>
                        </View>
                    </TouchableHighlight>
                    {
                            <View style={{flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical:15,alignItems:'flex-start',  }}>
                                <View style={{ justifyContent: 'space-around',width:120 }}>
                                       <CustomText style={curStyle.detailTimeFont} text={ticket.start_time} />
                                        <View style={{flexDirection:'row',alignItems:'flex-start',width:90,}}>
                                            {/* <CustomText style={{height:15,width:15,backgroundColor:Theme.theme,color:'#fff',borderRadius:2,fontSize:12,textAlign:'center',marginRight:2}} text={'始'}></CustomText>  */}
                                            <View style={{flexDirection:'row',height:14,width:14,backgroundColor:Theme.theme,alignItems:'center',justifyContent:'center',borderRadius:2,marginRight:2,marginTop:2}}>
                                                <Feather name={'arrow-up-right'} style={{textAlign:'center'}} size={15} color={'#fff'}/>
                                            </View>
                                            <CustomText style={curStyle.detailMainFont} text={Util.Parse.isChinese() ? ticket.from_station_name : ticket.FromStationEnName} />
                                        </View>
                                </View>
                                 <View style={[{ flex: 1 }, curStyle.center]}>
                                    <CustomText style={{color: Theme.commonFontColor,}} text={train_code} />
                                    <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                                    <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                                    </View>
                                    <TouchableOpacity style={{flexDirection:'row', alignItems:'center'}} onPress={()=>{}}>
                                        <CustomText allowFontScaling={false} style={{ color: Theme.aidFontColor,fontSize:12 }} text={runTimeDesc} />
                                        <Image style={{marginLeft:2,height:5,width:7}} source={require('../../res/Uimage/trainFloder/caret_down.png')}/>
                                    </TouchableOpacity>
                                </View>
                                <View style={{  alignItems:'flex-end',width:120 }}>
                                    <CustomText style={[curStyle.detailTimeFont, {  }]} text={ticket.arrive_time} />
                                    <View style={{flexDirection:'row-reverse',width:90}}>
                                        <CustomText style={[curStyle.detailMainFont, {textAlign:'right'}]}  text={Util.Parse.isChinese() ? ticket.to_station_name : ticket.ToStationEnName} />
                                        <View style={{flexDirection:'row',height:14,width:14,backgroundColor:Theme.RedMarkColor,alignItems:'center',justifyContent:'center',borderRadius:2,marginRight:2,marginTop:2}}>
                                            <Feather name={'arrow-down-right'} style={{textAlign:'center'}} size={15} color={'#fff'}/>
                                        </View>
                                    </View>
                                </View>
                                { 
                                    arrive_days > 0 ?<View style={{ width: 18 }}>
                                        <CustomText style={{ color: 'white', fontSize: 12, marginTop: 15 }} text={arrive_days > 0 ? '+' + arrive_days : ''} />
                                    </View>:null
                                }
                            </View>
                    }
                        <View style={{flexDirection:'row',marginVertical: 5,}}>
                            <CustomText style={{  color: Theme.theme, fontSize: 12, fontWeight: 'bold',paddingHorizontal:10 }} onPress={()=>{this._standerReason(ticket.RcReason)}} text='超标原因' /> 
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center',paddingHorizontal:10,borderTopWidth:1,paddingVertical:10,borderColor:Theme.lineColor }}>
                            <CustomText style={curStyle.detailMarkFont} text={selectedSeat.seat} />
                            <CustomText style={curStyle.detailMarkFont} text={': ¥ ' + selectedSeat.price} />
                        </View>
                    
                </View>
            </View>
        )
    }
    _standerReason = (rcReason) => {
        const {otwThis} = this.props
        let reason = '';
        reason +=rcReason&&  rcReason.RuleTypeDesc  + ':'
        reason += Util.Parse.isChinese()? rcReason&& rcReason.ReasonDesc : rcReason&& rcReason.ReasonDescEn + '\n'
        if (!rcReason) {
            otwThis.toastMsg('该订单无超标');
        } else {
            otwThis.showAlertView(reason, () => {
                return ViewUtil.getAlertButton('确定', () => {
                    otwThis.dismissAlertView();
                })
            });
        }
    }
}
const curStyle = StyleSheet.create({
    detailAidFont: {
        fontSize: 12,
        color: '#999'
    },
    detailMarkFont: {
        fontSize: 12,
        color: Theme.assistFontColor
    },
    detailTimeFont: {
        fontSize: 25,
        fontWeight:'bold'
    },
    aidFont: {
        color: '#999',
        fontSize: 15
    },
    imageStyle: {
        width: 30,
        height: 30,
        marginLeft: 5
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:10
    },
    detailMainFont: {
        // width:90
    },
    lostyle:{ 
        backgroundColor: Theme.orangeColor, 
        marginRight: 5,
        // width:16,
        height:16,
        alignItems:'center',
        justifyContent: 'center',
        borderRadius:2,
        paddingHorizontal:3
    }
});