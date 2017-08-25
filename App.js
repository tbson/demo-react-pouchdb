import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import PouchDB from 'pouchdb-react-native'


PouchDB.plugin(require("pouchdb-validation"));

const db = new PouchDB('cloudo');
const remoteUrl = 'http://192.168.1.20:5984/cloudo';

let options = {
  live: true,
  retry: true,
  continuous: true
};

db.sync(remoteUrl, options);
remoteDB = new PouchDB(remoteUrl);

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      data: []
    };
    this.getTodos = this.getTodos.bind(this);
    this.createTodo = this.createTodo.bind(this);
    this.updateTodo = this.updateTodo.bind(this);
    this.deleteTodo = this.deleteTodo.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.renderList = this.renderList.bind(this);
    db.changes({live: true, since: 'now', include_docs: true}).on('change', change => {
      console.log(change);
      this.handleChange(change.doc);
    });
  }

  async getTodos(){
    try{

      await db.replicate.from(remoteDB);

      if(this.state.data.length){
        return this.state.data;
      }
      return await db.allDocs({include_docs: true});
    }catch(e){
      console.error(e);
      return [];
    }
  }

  async componentDidMount(){
    const listItem = await this.getTodos();
    const data = listItem.rows.map(item => item.doc).filter(item => item.title);
    this.setState({data});
  }

  createTodo(todo){
    let data = {title: "Title" + Math.floor((Math.random() * 10) + 1)};
    db.post(data);
  }

  updateTodo(todo){
    db.put(todo).catch((err) => {
      console.log(err);
    });
  }

  deleteTodo(todo){
    db.remove(todo).catch((err) => {
      console.log(err);
    });
  }

  handleChange(change){
    let listItem = this.state.data;
    let changedIndex = listItem.findIndex(item => (item._id === change._id ? true : false));

    //A document was deleted
    if(change._deleted){
      listItem.splice(changedIndex, 1);
    } else {
      if(changedIndex !== -1){
        //A document was updated
        listItem[changedIndex] = change;
      } else {
        //A document was added
        listItem.push(change);
      }
    }
    this.setState({data: listItem});
  }

  renderList(){
    return this.state.data.map((item, index) => {
        return (
          <View key={index}>
            <Text>{item.title}</Text>
          </View>
        );
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Button
          onPress={this.createTodo}
          title="Add new"
          color="#841584"
        />
        {this.renderList()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
