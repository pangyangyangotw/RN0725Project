/**
 * 相册单选按钮
 */
import React,{PureComponent} from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import Theme from '../../res/styles/Theme'
export default class RadioView extends PureComponent {

    static propTypes = {};

    constructor(props) {
        super(props);
        this.state = {
            bgc: Theme.greenBg,
        }
    }

    render() {

        let color = this.props.checked ? this.state.bgc : '#fff';
        let fontSize = this.props.checked ? 14 : 13;
        let fontColor =  this.props.checked ? Theme.theme : '#666666';
        let borderC =  this.props.checked ? Theme.theme : '#ccc';

        return (
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <TouchableOpacity
                    onPress={this.pressed.bind(this)}
                    style={{
                        backgroundColor: color, 
                        // width:(global.screenWidth-30)/4.3,
                        height: 30, 
                        borderRadius: 4, 
                        borderColor: borderC, 
                        borderWidth: 1,
                        alignItems:"center",
                        justifyContent:'center',
                        marginLeft:5,
                        marginTop:15,
                        paddingHorizontal:8
                        }}>
                        <Text style={{color:fontColor,fontSize:fontSize,}}>{this.props.text}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    pressed() {
        let {id, onCheck ,value2} = this.props;
        onCheck(id,value2);
    }
}