from flask import Flask, render_template, json, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config.from_object('config')
db = SQLAlchemy(app)

class Nodes(db.Model):
    id = db.Column(db.INTEGER, primary_key=True)
    x = db.Column(db.INTEGER)
    y = db.Column(db.INTEGER)
    title = db.Column(db.VARCHAR)
    description = db.Column(db.TEXT)

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return 'Id: %r Title: %r' % (self.id, self.title)

class Links(db.Model):
    id = db.Column(db.INTEGER, primary_key = True)
    source = db.Column(db.INTEGER)
    target = db.Column(db.INTEGER)

    def __init__(self, source, target):
        self.source = source
        self.target = target

    def __repr__(self):
        return 'source: %r target: %r>' % (self.source, self.target)

@app.route("/")
def main():
    return render_template('index.html')

@app.route('/datapoints')
def datapoints():
    nodes = Nodes.query.all()

    nodes_dict = []
    for node in nodes:
        node_dict = {
                'x': node.x,
                'y': node.y,
                'title': node.title,
                'description': node.description
        }
        nodes_dict.append(node_dict)

    links = Links.query.all()

    links_dict = []
    for link in links:
        link_dict = {
                'source': link.source,
                'target': link.target
        }
        links_dict.append(link_dict)

    return json.dumps({'nodes': (nodes_dict),'links': (links_dict)})

@app.route('/updateData', methods=['GET','POST'])
def updateData():

    xCord = request.json['x']
    yCord = request.json['y']

    newNode = Nodes(xCord,yCord)
    db.session.add(newNode)
    db.session.commit()

    try:
        source = request.json['source']
        targets = request.json['targets']

        for target in targets:
            newLink = Links(source,target)
            db.session.add(newLink)

        db.session.commit()

    except KeyError:
        print('no links')

    return json.dumps({'status':'OK'})

@app.route('/SaveData', methods=['GET','POST'])
def SaveData():

    JSnodes = request.json['nodes']
    JSlinks = request.json['links']

    for node in JSnodes:
        id = node['index'] + 1
        if Nodes.query.get(int(id)):
            editedNode = Nodes.query.get(int(id))
            editedNode.x = node['x']
            editedNode.y = node['y']
            editedNode.title = node['title']
            editedNode.description = node['description']
            db.session.commit()
        else:
            newNode = Nodes(node['x'],node['y'])
            newNode.id = id
            #newNode.title = node['title']
            #newNode.description = node['description']
            db.session.add(newNode)
            db.session.commit()

    for index,link in enumerate(JSlinks):
        print(link['source']['index'])
        print(link['target']['index'])
        id = index + 1
        if Links.query.get(int(id)):
            editedLink = Links.query.get(int(id))
            editedLink.source = link['source']['index']
            editedLink.target = link['target']['index']
            db.session.commit()
        else:
            Source = link['source']['index']
            Target = link['target']['index']
            newLink = Links(Source,Target)
            newLink.id = id
            db.session.add(newLink)
            db.session.commit()

    return json.dumps({'status':'OK'})

if __name__ == "__main__":
    app.debug = True
    app.run()