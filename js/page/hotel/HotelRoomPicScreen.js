import React from 'react';
import {
    View,
    TouchableOpacity,
    ImageBackground,
    StyleSheet,
    FlatList,
    Dimensions,
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import RadioView from '../common/RadioView';
import Theme from '../../res/styles/Theme'
import Util from '../../util/Util';
import { Themed } from 'react-navigation';
export default class HotelRoomPicScreen extends SuperView {
    static propTypes = {};
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '酒店相册'
        }
        this.state={
            bgc: '#e83328',
            allPicList: this.params,
            flag:1
        } 
    }
   
    checkCallBack = (id,value) => {
        this.setState({
            flag: id,
            allPicList:value,
        });
    };

    renderBody() {
        const {state} = this.props.navigation;
        if(!this.params) return null;

        //给数组分类
        let data = []
        for(var i = 0; i < this.params.length; i++) {
            if(!data[this.params[i].TypeDesc]) {
                var arr = [];
                arr.push(this.params[i]);
                data[this.params[i].TypeDesc] = arr;
            }else {
                data[this.params[i].TypeDesc].push(this.params[i])
            }
        }
        let labelArr = Object.keys(data);//获取对象的键值对的键
        let labelArr2 = Object.values(data); //获取对象的键值对的值 

        // let color = this.props.checked ? this.state.bgc : '#fff';
        return (
            
            <View style={{ flex: 1 }}>
                <View style={styles.titleViewStyle}>
                <RadioView  id={1} value2={this.params} onCheck={this.checkCallBack} radius={16} value={this.params}
                            bgc={Theme.theme} checked={this.state.flag === 1} text = {Util.Parse.isChinese()? '全部':'All'+' ('+this.params.length+')'}/>
                        {labelArr.map((item, index) => {
                            return (
                                <RadioView  id={index+2} value2={labelArr2[index]} onCheck={this.checkCallBack} radius={16} value={this.params}
                            bgc='#ffa' checked={this.state.flag === index+2} text ={item+" ("+labelArr2[index].length+")"}/>
                              );
                            }
                        )}
                </View>
                <FlatList
                    data={this.state.allPicList}
                    numColumns={2}
                    style={{padding:5}}
                    showsVerticalScrollIndicator={false}
                    renderItem={({item,index}) =>
                                    <TouchableOpacity onPress={()=>{
                                         this.push('HotelRoomPicItem',    
                                         {
                                            items: this.state.allPicList,
                                            index: index
                                        }
                                        );}}>
                                        <ImageBackground
                                            source={{
                                            uri:item.Url,
                                            }}
                                            resizeMode={'stretch'}
                                            imageStyle={{borderRadius:6}}
                                            style={{width:(global.screenWidth-40)/2 ,marginLeft:10,height:(global.screenWidth-40)/2/3*2,marginTop:10}}
                                            key={index}
                                       />
                                    </TouchableOpacity>    
                                }
                    ListFooterComponent={ this._renderFooter }
                    />


            </View>
        )
    } 
}
const styles = StyleSheet.create({
    titleStyle:{
        alignItems:"center",
        justifyContent:'center',
        marginTop:20,
        width:(global.screenWidth-30)/4.3,
        marginLeft:5,
        height:30,
        backgroundColor:'#aaf',
        borderRadius:15
    },
    ChooseStyle:{
        alignItems:"center",
        justifyContent:'center',
        marginTop:20,
        width:(global.screenWidth-30)/4.3,
        marginLeft:5,
        height:30,
        backgroundColor:'green',
        borderRadius:15
    },
    titleViewStyle:{
        margin:15,
        marginTop:2,
        flexDirection:'row',
        flexWrap:'wrap',   
    }
})