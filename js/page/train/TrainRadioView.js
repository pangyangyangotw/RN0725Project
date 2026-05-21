/**
 * 火车抢票单选按钮
 */
import React,{PureComponent} from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import Theme from '../../res/styles/Theme';
const screenWidth = Dimensions.get('screen').width;
export default class TrainRadioView extends PureComponent {

    static propTypes = {};

    constructor(props) {
        super(props);
        this.state = {
            bgc: '#e83328',
        }
    }

    render() {

        let color = this.props.checked ? Theme.theme : '#e6e6e6';
        let fontSize = this.props.checked ? 12 : 12;
        let fontColor =  this.props.checked ? Theme.theme : '#666666';

        return (
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <TouchableOpacity
                    onPress={this.pressed.bind(this)}
                    style={{
                        // backgroundColor: color, 
                       
                        width:screenWidth/5, height: 30, 
                        borderRadius: 6, 
                        borderColor: '#d9d9d9', 
                        borderWidth: 1,
                        borderColor:color,
                        alignItems:"center",
                        justifyContent:'center',
                        marginLeft:10,
                        marginRight:10,
                        marginBottom:10
                        }}>
                        <Text style={{color:fontColor,fontSize:fontSize,fontWeight:this.props.checked ? 'bold' : 'normal'}}>{this.props.text}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    pressed() {
        let {id, onCheck ,value2} = this.props;
        onCheck(id,value2);
    }
}