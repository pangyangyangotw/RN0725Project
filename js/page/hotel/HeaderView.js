import React, { Component } from 'react';
import {
    View,
    Text,
    Dimensions,TouchableOpacity
} from 'react-native';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import I18nUtil from '../../util/I18nUtil';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Util from '../../util/Util';
const { width, height } = Dimensions.get('screen')
import RenderHtml from 'react-native-render-html';

export default class HeaderView extends Component {
    state = {
        numberOfLines: 3,
        ruleShow:true,
    }
    // 超标原因
    _showRc = () => {
        const { otwThis, RcReason } = this.props;
        let reason = []
        var RcReasons = RcReason.filter(i => i)
        RcReasons && RcReasons.map((item) => {
            reason.push((item.RuleTypeDesc ) + ': ' + (Util.Parse.isChinese() ? item.Reason : item.ReasonEn))
        })
        let reasonArr = reason.join('\n')
        otwThis.showAlertView(reasonArr);
    }
    // 取消规则
    _cancelRule = () => {
        const { roomModel, otwThis } = this.props;
        let cancle = I18nUtil.translate('取消政策') + ':';
        if (roomModel.CancelRules && roomModel.CancelRules.length > 0) {
            if (roomModel.CancelRules[0]) {
                cancle = cancle + roomModel.CancelRules[0]['Desc'];
            }
        } else {
            cancle = cancle + I18nUtil.translate('免费取消');
        }
        otwThis.showAlertView(cancle);
    }
    _join = () => {
        const { otwThis } = this.props;
        otwThis.showAlertView('住宿提供方要求该价格中国大陆客人专享');
    }

    bookRule = () => {
        const { roomModel, otwThis } = this.props;

        otwThis.showAlertView(desc);
    }

    render() {
        const { orderModel, roomModel, roomIdModel, checkIndate, liveDay, RcReason, userInfo, hotelCanselRule,paramItems,SearchGuestNum,ruleShow } = this.props;
        let cancle = '';
        if (roomModel.CancelRules && roomModel.CancelRules.length > 0) {
            if (roomModel.CancelRules[0]) {
                cancle = cancle + roomModel.CancelRules[0]['Desc'];
            }
        } else {
            cancle = cancle + I18nUtil.translate('免费取消');
        }
        let liveDate = checkIndate.addDays(liveDay);

        let orderBookdesc = '';
        if (roomModel && roomModel.BookingRules) {
            roomModel.BookingRules.forEach(obj => {
                if (obj.Desc) {
                    orderBookdesc += obj.Desc;
                }
            })
        }
        const unescapeHTML = (str) => {
            return str?.replace(/&lt;/g, '<')
                         ?.replace(/&gt;/g, '>')
                         ?.replace(/&quot;/g, '"')
                         ?.replace(/&amp;/g, '&');
                          // 截取前3行并添加省略号
                    const lines = decoded?.split(/<br\s*\/?>|<\/p>/gi) || [];
                    const truncated = lines.slice(0, 3).join('<br>');
                    return lines.length > 3 ? `${truncated}...` : decoded;
        };
        return (
            <View style={{  }}>
                <View style={{
                    backgroundColor: "white", marginHorizontal: 10, padding: 20, borderRadius: 6,
                }}>
                    <CustomText style={{fontSize:14,fontWeight:'bold'}} text={Util.Parse.isChinese()?orderModel.HotelName:orderModel.HotelNameEn} />
                   {Util.Parse.isChinese() && (orderModel.HotelName != orderModel.HotelNameEn) ? <CustomText text={orderModel.HotelNameEn} /> :null} 
                    <View style={{   marginVertical: 10,flexWrap:'wrap' }}>
                        <View style={{flexDirection: 'row',}}>
                            <CustomText style={{ fontSize:12 }}  text={checkIndate.format('MM-dd')} ></CustomText>
                            <CustomText style={{ fontSize:12 }} text={"("+checkIndate.getWeek()+")"}></CustomText>
                            <View style={{ backgroundColor:Theme.greenBg,borderRadius:2,borderWidth:1,marginHorizontal:10,flexDirection:'row',justifyContent:'center',alignItems:'center',borderColor:Theme.theme,paddingHorizontal:3}}>
                                <CustomText  style={{fontSize:12,color:Theme.theme }} text={liveDay}></CustomText>
                                <CustomText  style={{fontSize:12,color:Theme.theme }} text={'晚'}></CustomText>
                            </View>
                            <CustomText style={{ fontSize:12 }} text={liveDate.format('MM-dd')} ></CustomText>
                            <CustomText style={{ fontSize:12 }} text={"("+liveDate.getWeek()+")"}></CustomText>
                        </View>
                        <View style={{marginTop:5,flexDirection:'row',flexWrap:'wrap'}}>
                            <CustomText text={roomIdModel.RoomName + ' ' + roomModel.RatePlanName} />
                            {roomModel.GuestType === 3 ? <CustomText text={'内宾专享'} style={{  marginRight: 4,backgroundColor:Theme.theme,color:'#fff',fontSize: 12, paddingHorizontal:8,borderRadius:2 }} onPress={this._join} /> : null}
                            {
                                paramItems&&paramItems.ChannelTag ?
                                    <Text>
                                        <CustomText text={paramItems.ChannelTag} style={{ color: 'white', fontWeight: 'bold',backgroundColor:Theme.theme,paddingHorizontal:4,marginRight:4,borderRadius:2}}  />
                                    </Text>  
                                : null
                            }
                            {
                                paramItems&&paramItems.RpLabel && paramItems.RpLabel.map(obj=>{
                                    let label;
                                    if(obj === '2SAgreement' || obj ==='价格计划2S协议'){
                                            label = 'FCM';
                                    }else if (obj === '3SAgreement' || obj ==='价格计划3S协议') {
                                        label = Util.Parse.isChinese()?'协议':'Corp';
                                    }else{
                                        label = ''
                                    }
                                    return (
                                    <CustomText text={label} style={{ fontSize: 12, paddingHorizontal:8,backgroundColor:'orange',color:'#fff',borderRadius:2 }} />
                                    )
                                })
                            }
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                        <CustomText allowFontScaling={false} numberOfLines={2} style={{ color: Theme.aidFontColor, fontSize: 12 }} text={roomModel.Breakfast > 0 ? (roomModel.Breakfast + '份早餐') : '无早'} />
                        <CustomText style={{ color: Theme.promptFontColor, fontSize: 12, marginLeft: 2 }} text={' | '} />
                        <RenderHtml
                            source={{ 
                                html: unescapeHTML(roomIdModel.Desc) // 应用反转义函数
                            }}
                        />
                    </View>
                    <CustomText style={{ color: Theme.assistFontColor, fontSize: 12, marginLeft: 2 }} text={SearchGuestNum+' adult per room'} />
                    {/* <View style={{ backgroundColor: Theme.lineColor, height: 1, marginVertical: 10 }}></View> */}
                    {/* <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <AntDesign name={'exclamationcircleo'} size={13} color={Theme.specialColor2}></AntDesign>
                        {userInfo && userInfo.Name ? <Text style={{ color: Theme.promptFontColor, marginLeft: 5, fontSize: 13 }}>{I18nUtil.tranlateInsert('本次预订使用{{noun}}的差旅标准', userInfo.Name)}</Text> : null}
                    </View> */}
                    {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <CustomText text={'预订政策'} style={{ fontSize: 13, marginTop: 5,fontWeight:'bold' }} />
                        {orderBookdesc.length > 60 ? <CustomText text={this.state.numberOfLines == 3 ? '展开':'收起'} style={{ color: Theme.theme }} onPress={()=>{
                               if(this.state.numberOfLines == 3){
                                   this.setState({
                                       numberOfLines:0
                                   })
                               }else{
                                   this.setState({
                                       numberOfLines:3
                                   })
                               }
                        }}/> : null}
                    </View> */}

                    {/* <CustomText text={orderBookdesc} style={{ marginTop: 10, color: Theme.aidFontColor }} numberOfLines={this.state.numberOfLines} /> */}
                    <View style={{ backgroundColor: Theme.lineColor, height: 1, marginVertical: 10 }}></View>
                    <View style={{}}>
                        <CustomText text={'预订政策'} style={{ fontSize: 13, marginTop: 5,fontWeight:'bold'}} />
                        <View style={{ 
                            maxHeight:this.state.ruleShow? 60 : "100%", // 假设行高20*3
                            overflow: 'hidden',
                            flex: 0 // 防止flex布局拉伸
                        }}>
                            {
                                roomModel?.BookingRules?.map((item, index) => {
                                    return (
                                        <RenderHtml
                                            contentWidth={width - 40}
                                            source={{ 
                                                html: unescapeHTML(item.Desc) // 应用反转义函数
                                            }}
                                            tagsStyles={{
                                                '*': {
                                                    fontFamily: 'System', // iOS和Android默认系统字体
                                                },
                                                // 其他标签样式...
                                            }}
                                        />
                                    )
                                })
                            }
                        </View>
                        <TouchableOpacity 
                            onPress={() => this.setState({ruleShow: !this.state.ruleShow})}
                            style={{alignSelf: 'flex-end', padding: 8}}
                        >
                            <CustomText 
                            text={!this.state.ruleShow ? '收起' : '展开'} 
                            style={{color: Theme.theme}}
                            />
                        </TouchableOpacity>
                    </View>
                    {
                        roomModel?.PrepayRules?.length > 0 && <View >
                            <View style={{ backgroundColor: Theme.lineColor, height: 1, marginVertical: 10 }}></View>
                            <View style={{}}>
                                <CustomText text={'预付规则'} style={{ fontSize: 13, marginTop: 5,fontWeight:'bold'}} />
                                <View>
                                    {
                                        roomModel?.PrepayRules?.map((item, index) => {
                                            return (
                                                <RenderHtml
                                                    contentWidth={width - 40}
                                                    source={{ 
                                                        html: unescapeHTML(item.Desc) // 应用反转义函数
                                                    }}
                                                    tagsStyles={{
                                                        '*': {
                                                            fontFamily: 'System', // iOS和Android默认系统字体
                                                        },
                                                        // 其他标签样式...
                                                    }}
                                                />
                                            )
                                        })
                                    }
                                </View>
                            </View>
                        </View>
                    }
                    <View style={{ backgroundColor: Theme.lineColor, height: 1, marginVertical: 10 }}></View>
                    <View style={{}}>
                        <CustomText text={'取消规则'} style={{ fontSize: 13, marginTop: 5,fontWeight:'bold'}} />
                        <CustomText text={cancle} style={{ marginTop: 10, color: Theme.aidFontColor }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: "space-between", alignItems: 'center',marginTop: 10 }}>
                        <CustomText text={RcReason ? '超标原因' : ""} style={{ color: Theme.theme , fontSize: 12, fontWeight: 'bold'}} onPress={this._showRc} />
                    </View>

                </View>
            </View>
        )
    }
}