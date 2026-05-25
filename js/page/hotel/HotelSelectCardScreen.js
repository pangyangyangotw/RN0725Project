import React from 'react';
import { ScrollView, View,TouchableOpacity,StyleSheet,Image } from 'react-native';
import CustomText from '../../custom/CustomText';
import SuperView from '../../super/SuperView';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Theme from '../../res/styles/Theme';
export default class HotelSelectCardScreen extends SuperView{
    HotelCardTypeList  =  [
        {Name:'维萨卡(Visa)',Value:11,CardType:'VI',require: require('../../res/image/visaicon.png'), },
        {Name:'万事达卡(Master Card)',Value:9,CardType:'MC',require: require('../../res/image/mastericon.png'),},
        {Name:'万事达卡(Master Card)',Value:9,CardType:'CA',require: require('../../res/image/mastericon.png'),},
        {Name:'日财卡(Japanese Credit Bureau Credit Card)',Value:8,CardType:'JC',require: require('../../res/image/jcb-logo.png'),},
        {Name:'美国运通卡(American Express)',Value:1,CardType:'AX',require: require('../../res/image/amexicon.png'),},
        {Name:'大莱卡(Diners Club)',Value:5,CardType:'DC',require: require('../../res/image/dinnersclubicon.png'),},
        {Name:'发现卡(Discover Card)',Value:6,CardType:'DS',require: require('../../res/image/discovericon.png'),},
        {Name:'中国银联卡(China Union Pay Card)',Value:0,CardType:'UP',require: require('../../res/image/chinaunionpay.png'),},
        // {Name:'环球航空旅行计划卡(Universal Air Travel Card)',Value:10,CardType:'TP'},
      ];
    yilongUn = {Name:'中国银联卡(China Union Pay Card)',Value:0,CardType:'UP'}
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: "请选择"
        }
        let cardList= []
        this.HotelCardTypeList.map((obj,index)=>{
            this.params.GuaranteeTypeArr.map(item=>{
                if(item==obj.CardType){
                    cardList.push(obj)
                }
            })
        })
        if(!(this.params.GuaranteeTypeArr && this.params.GuaranteeTypeArr.length>0)){
            this.HotelCardTypeList.splice(1, 1);
        }     
        if(this.params.yilong){
            if(JSON.stringify(cardList).indexOf(JSON.stringify(this.yilongUn)) === -1){
                cardList.push(this.yilongUn)
            }
        }
       
        this.state = {
            cardName:null,
            IdName: "",
            cvv: '',
            validYear: '',
            validMonth: '',
            Name: '',
            SeriNumber: '',
            Type: "身份证",
            options: ['身份证', '护照', '其它'],
            cardList:cardList&&cardList.length>0?cardList:this.HotelCardTypeList,
        }
    }
    renderBody(){
        const {cardName,yilong} = this.params;
        const {cardList} = this.state;
        return (
            <View style={{
                flex:1
            }}>
            <ScrollView keyboardShouldPersistTaps='handled'>
                {
                    cardList&&cardList.map((obj,index)=>{
                            return(
                                <TouchableOpacity 
                                onPress={()=>{
                                    this.params.callBack(obj);
                                    this.props.navigation.pop();
                                }}
                                >
                                    <View key={index} style={styles.listStyle}>
                                        <Image style={{height:20, width:50, resizeMode:'contain',marginRight:5}} source={obj.require} />
                                        <CustomText text={obj.Name}/>
                                        {cardName && cardName.Value == obj.Value ? <MaterialIcons
                                                name={'check-box'}
                                                size={28}
                                                color={Theme.theme}
                                        /> :null}
                                    </View>
                                </TouchableOpacity>
                            )
                    })
                }
            </ScrollView>
            </View>
        )
    }
}
const styles = StyleSheet.create({
   listStyle:{
        height:44,
        backgroundColor:'white',
        flexDirection:"row",
        alignItems:"center",
        // justifyContent:"space-between",
        paddingHorizontal:10,
        borderBottomColor:"#e6e6e6",
        borderBottomWidth:0.5,
    }
})