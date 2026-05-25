import React  from 'react';
import {
  ScrollView,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Image,
  Linking,
  Platform
} from 'react-native';
import HTMLView from 'react-native-htmlview';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
var deviceWidth = Dimensions.get('window').width;
import AntDesign from 'react-native-vector-icons/AntDesign';

export default class HotelInstroScreen extends SuperView {
    constructor(props) {
        super(props);
        this._navigationHeaderView = {
            title: '设施详情'
        }
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.state = {
            position: 0,
            positionY:0,
            heightY:0,
            heightY2:0,
            heightY3:0,
            heightY4:0,
            isShowSort:true,
            textHeight:38
        }
    }
    myScrollView = event => {
        //使用大括号是为了限制let结构赋值得到的变量的作用域，因为接来下还要结构解构赋值一次
        // {
        //获取根View的宽高，以及左上角的坐标值
        var offsetY = event.nativeEvent.contentOffset.y; //滑动距离
        // let {x, y, width, height} = event.nativeEvent.layout;
        if(offsetY<=this.state.heightY){
            this.setState({position: 0})
        }else if(offsetY <= this.state.heightY+this.state.heightY2){
            this.setState({position: 1,positionY:this.state.heightY});
        }else if(offsetY <= this.state.heightY+this.state.heightY2+this.state.heightY3){
            this.setState({position: 2,positionY:this.state.heightY+this.state.heightY2});
        }else{
            this.setState({position: 3,positionY:this.state.heightY+this.state.heightY2+this.state.heightY3});
        }
    }
    changeViewLayout(event) {//获取View的高度
       this.layout1 = event.nativeEvent.layout;
       this.setState({heightY:event.nativeEvent.layout.height})
    }
    changeViewLayout2(event) {
        this.layout2 = event.nativeEvent.layout;
       this.setState({heightY2:event.nativeEvent.layout.height})
    }
    changeViewLayout3(event) {
        this.layout3 = event.nativeEvent.layout;
       this.setState({heightY3:event.nativeEvent.layout.height})
    }
    changeViewLayout4(event) {
        this.layout4 = event.nativeEvent.layout;
        this.setState({heightY4:event.nativeEvent.layout.height})
    }

    

    /**
     * 联系客服
     */
  _btnContactTel = () => {
    const {state} = this.props.navigation;
    if(!this.params) return null;
    var url = 'tel:'+this.params.Phone;
   const {customerInfo} = this.state;
   
   if(customerInfo&& customerInfo.Setting && customerInfo.Setting.ServiceTelExtras && customerInfo.Setting.ServiceTelExtras.Tel){
     url = `tel:${this.params.Phone}`
   }
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        console.log('Can\'t handle url: ' + url);
      }
    }).catch(err => {
      console.log(err);
    });
  }
    
    renderBody() {
        const {state} = this.props.navigation;
        const {isShowSort,textHeight} = this.state
        if(!this.params) return null; 
        ////////
        const {selectDate,liveDate}=this.params
         return (
              <View style={{ flex: 1 }}>
                  <View style={{flexDirection:'row',justifyContent:'space-around'}}>
                      <TouchableOpacity style={{height:40,paddingTop:15,paddingBottom:5,
                                                borderBottomWidth:this.state.position===0?1:0,
                                                borderBottomColor:Theme.theme
                                                }}
                                                onPress={()=>{
                                                    this.setState({position: 0,positionY:0});
                                                        if(Platform.OS === 'android'){
                                                            this.myScrollViews.scrollTo({ x: 0, y: this.layout1.y, animated: true});
                                                        }
                                                    }} >
                            <CustomText style={{color:this.state.position===0?Theme.theme:'gray',fontSize:this.state.position===0?16:15}} text='酒店介绍'/>
                      </TouchableOpacity>
                      <TouchableOpacity style={{height:40,paddingTop:15,paddingBottom:5,
                                                borderBottomWidth:this.state.position===1?1:0,
                                                borderBottomColor:Theme.theme
                                                }}
                                                onPress={()=>{
                                                    this.setState({position: 1,positionY:this.state.heightY});
                                                        if(Platform.OS === 'android'){
                                                          this.myScrollViews.scrollTo({ x: 0, y: this.layout2.y, animated: true});
                                                        }
                                                    }} >
                             <CustomText style={{color:this.state.position===1?Theme.theme:'gray',fontSize:this.state.position===1?16:15}} text='入住须知'/>
                      </TouchableOpacity>
                      <TouchableOpacity style={{height:40,paddingTop:15,paddingBottom:5,
                                                borderBottomWidth:this.state.position===2?1:0,
                                                borderBottomColor:Theme.theme
                                                }}
                                                onPress={()=>{
                                                    this.setState({position: 2,positionY:this.state.heightY+this.state.heightY2});
                                                        if(Platform.OS === 'android'){
                                                           this.myScrollViews.scrollTo({ x: 0, y: this.layout3.y, animated: true});
                                                        }
                                                    }} >
                             <CustomText style={{color:this.state.position===2?Theme.theme:'gray',fontSize:this.state.position===2?16:15}} text='酒店设施'/>  
                      </TouchableOpacity>
                      <TouchableOpacity style={{height:40,paddingTop:15,paddingBottom:5,
                                                borderBottomWidth:this.state.position===3?1:0,
                                                borderBottomColor:Theme.theme
                                                }}
                                                onPress={()=>{
                                                    this.setState({position: 3,positionY:this.state.heightY+this.state.heightY2+this.state.heightY3});
                                                        if(Platform.OS === 'android'){
                                                             this.myScrollViews.scrollTo({ x: 0, y: this.layout4.y, animated: true});
                                                        }
                                                    }} >
                             <CustomText style={{color:this.state.position===3?Theme.theme:'gray',fontSize:this.state.position===3?16:15}} text='交通'/>
                      </TouchableOpacity>
                      
                  </View>
                   <View style={{borderWidth:0.5,borderColor:Theme.lineColor}}/>
                   <ScrollView 
                               onScroll={this.myScrollView.bind(this)} 
                                style={{marginTop:15,marginBottom:20}}
                                contentOffset={{x:0,y:this.state.positionY}}                               
                                ref={(view) => { this.myScrollViews = view; }}
                                keyboardShouldPersistTaps='handled'
                                showsVerticalScrollIndicator={false}
                               >
                                <View  style={{backgroundColor:'#fff'}} onLayout={this.changeViewLayout.bind(this)}>
                                     <View style={{padding:15}}>
                                        <View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap'}}>
                                          <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                                          <CustomText style={{fontSize:15,fontWeight:'bold'}} text='酒店介绍'/>
                                          <CustomText style={{fontSize:15,fontWeight:'bold'}} text='-'/>
                                          <Text style={{fontSize:15,fontWeight:'bold',color:"#333"}}>{this.params.HotelName}</Text>
                                        </View> 
                                        {/* <Text style={{fontSize:13,color:Theme.darkColor,paddingTop:5}}>酒店数量：00</Text> */}
                                        {/* <Text style={{fontSize:13,color:Theme.darkColor,paddingTop:15,lineHeight:20}}>{this.params.Description ? this.params.Description : "暂无介绍"}</Text> */}
                                            <ImageBackground
                                                source={{
                                                uri:this.params.CoverImage,
                                                }}
                                                // resizeMode={'stretch'}
                                                style={{width:deviceWidth-30,height:deviceWidth/2,marginTop:15}}
                                                imageStyle={{borderRadius:6}}
                                            >
                                            </ImageBackground>
                                            <TouchableOpacity style={{height:40,width:deviceWidth-30,borderWidth:1,borderColor:Theme.theme,borderRadius:4,justifyContent:'center',alignItems:'center',marginTop:10}}
                                                            onPress={this._btnContactTel}
                                            >
                                                {this.params.Phone?
                                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                                    <Image source={require('../../res/image/icon-50.png')} style={{width:14,height:14}}/>
                                                    <CustomText style={{color:Theme.theme,marginLeft:5}} text={'酒店电话'}/>
                                                    <Text style={{color:Theme.theme,marginLeft:5}}>{this.params.Phone}</Text>
                                                </View>
                                                :null}
                                            </TouchableOpacity> 
                                            <TouchableOpacity style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:10}} onPress={()=>{
                                                this.setState({
                                                    isShowSort:!isShowSort,
                                                    textHeight:isShowSort?null:38
                                                })
                                            }}>
                                                <View style={{flexDirection:'row'}}>
                                                <CustomText style={{fontSize:13,color:Theme.commonFontColor}} text={'开业时间：'}/>
                                                <Text style={{fontSize:13,color:Theme.commonFontColor}}>{this.params.OpenDate}</Text>
                                                </View>
                                                <View style={{flexDirection:'row'}}>
                                                <AntDesign name={isShowSort ? 'caretdown' : 'caretup'} size={12} color={isShowSort ?Theme.theme:'gray'} style={{ }} />
                                                <CustomText style={{fontSize:12,color:Theme.commonFontColor}} text={'展开'}/>
                                                </View>
                                            </TouchableOpacity>
                                            <View style={{height:textHeight}}>
                                            <HTMLView value={this.params.Description ? this.params.Description : ""} stylesheet={{height:38}} style={{fontSize:13,color:Theme.commonFontColor}} />                                   
                                            </View>
                                            
                                    </View>
                                </View>
                                <View style={{backgroundColor:'#fff'}} onLayout={this.changeViewLayout2.bind(this)}>
                                    <View style={{padding:15}}>
                                        <View style={{flexDirection:'row',alignItems:'center'}}>
                                        <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                                        <CustomText style={{fontSize:15,fontWeight:'bold'}} text={'入住须知'}/>
                                        </View>
                                            {/* <View style={{flexDirection:'row',alignItems:'center',alignContent:'center',marginTop:15}}>
                                                <AntDesign name={'warning'} size={15} color={'red'}/>
                                                <CustomText text='重要提示' style={{ fontSize:14,fontWeight:'bold',marginLeft:5}} />
                                            </View>
                                            <CustomText text='重要提示重要提示重要提示重要提示重要提示' style={{ fontSize:13,color:Theme.darkColor,marginTop:10,marginLeft:17}} />  */}
                                            <View style={{flexDirection:'row',alignItems:'center',alignContent:'center',marginTop:15}}>
                                                <AntDesign name={'calendar'} size={15} color={'gray'} />
                                                <CustomText text='入离时间' style={{ fontSize:14,fontWeight:'bold',marginLeft:5}} />
                                            </View>
                                            <View style={{flexDirection:'row'}}>
                                            <CustomText text={'入住时间'} style={{ fontSize:13,color:Theme.darkColor,marginTop:10,marginLeft:17}} /> 
                                            <CustomText text={': '+selectDate} style={{ fontSize:13,color:Theme.darkColor,marginTop:10,marginLeft:17}} />
                                            </View>
                                            <View style={{flexDirection:'row'}}>
                                            <CustomText text={'离店时间'} style={{ fontSize:13,color:Theme.darkColor,marginTop:10,marginLeft:17}} /> 
                                            <CustomText text={': '+liveDate} style={{ fontSize:13,color:Theme.darkColor,marginTop:10,marginLeft:17}} />
                                            </View> 
                                            {/* <View style={{flexDirection:'row',alignItems:'center',alignContent:'center',marginTop:15}}>
                                                <MaterialCommunityIcons name={'hamburger'} size={16} color={'gray'} backgroundColor={'red'}/>
                                                <CustomText text='早餐' style={{ fontSize:14,fontWeight:'bold',marginLeft:5}} />
                                            </View>
                                            <CustomText text='供应：' style={{ fontSize:13,color:Theme.darkColor,marginTop:10,marginLeft:17}} />  */}
                                    </View>
                                    </View>
                                <View style={{borderWidth:0.5,borderColor:Theme.lineColor,width:deviceWidth-30,marginLeft:15}}/>
                                <View style={{backgroundColor:'#fff'}} onLayout={this.changeViewLayout3.bind(this)}>
                                    <View style={{padding:15}}>
                                       <View style={{flexDirection:'row',alignItems:'center'}}>
                                       <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                                       <CustomText style={{fontSize:15,fontWeight:'bold'}} text={'酒店设施服务'}/>
                                       </View>
                                          {
                                            this.params.Facilities?
                                            <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                                                {
                                                    this.params.Facilities.map((item, index) => {
                                                        return (
                                                        <View  style={{lexDirection:'row',padding:10,paddingTop:5,paddingBottom:5,borderWidth:0.5,marginTop:15,marginLeft:5,borderColor:Theme.lineColor,borderRadius:5}}>
                                                                <CustomText text={item.Name} style={{ fontSize:13,color:Theme.darkColor }} /> 
                                                        </View>
                                                        )
                                                    })
                                                } 
                                            </View> 
                                            :  
                                            <CustomText text={this.params.Facilities} style={{ fontSize:13,color:Theme.darkColor,marginTop:10,marginLeft:17}} />                                               
                                          }  
                                            
                                    </View>
                                </View>
                                <View style={{borderWidth:0.5,borderColor:Theme.lineColor,width:deviceWidth-30,marginLeft:15}}/>
                                <View style={{backgroundColor:'#fff'}} onLayout={this.changeViewLayout4.bind(this)}>
                                     <View style={{padding:15}}>
                                       <View style={{flexDirection:'row',alignItems:'center'}}>
                                       <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                                       <CustomText style={{fontSize:15,fontWeight:'bold'}} text={'交通'}/>
                                       </View>
                                            {/* <View style={{flexDirection:'row',alignItems:'center',alignContent:'center',marginTop:15}}>
                                                <MaterialIcons name={'flight-takeoff'} size={15} color={'gray'}/>
                                                <CustomText text='首都机场' style={{ fontSize:14,fontWeight:'bold',marginLeft:5}} />
                                            </View> */}
                                       <CustomText text={this.params.Traffic?this.params.Traffic:''} style={{ fontSize:13,color:Theme.darkColor,marginTop:10,marginLeft:17}} /> 
                                     </View> 
                                </View>
                    </ScrollView>
               
              </View>
     
        )
    }
}
