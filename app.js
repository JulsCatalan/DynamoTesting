import express from "express";
import cors from 'cors';
import "dotenv/config";
import { DynamoDBClient, PutItemCommand ,QueryCommand,DeleteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// Inicialización del cliente de DynamoDB
let dynamoDB;

try {
  dynamoDB = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY
    }
  });
  console.log("Conectado a DynamoDB");
} catch (error) {
  console.error("Error al conectar a DynamoDB:", error);
}

const putItem = async (params) => {
  try {
    const data = await dynamoDB.send(new PutItemCommand(params));
    console.log("Elemento agregado con exito:", data);
    return data;
  } catch (error) {
    console.error("Error al insertar el elemento:", error);
    throw error;
  }
};

const getCollection = async (params) => {
  try {
    const data = await dynamoDB.send(new ScanCommand(params));
    console.log(`Elementos encontrados en ${params.TableName}`);
    return data.Items; 
  } catch (error) {
    console.log(`Error al consultar datos de ${params.TableName}:`, error);
    throw error;  
  }
};

const deleteItem = async (params) =>{
  try {
    const data = await dynamoDB.send(new DeleteItemCommand(params));
    console.log('Elemento eliminado con exito', data);
  } catch (error) {
    console.error("Error al eliminar el elemento:", error);
    throw error;
  }
}


// Función para contar el número de ítems en la tabla y asignar el próximo ID
const getNextId = async () => {
  const params = {
    TableName: 'testing',
    Select: 'COUNT'
  };

  try {
    const data = await dynamoDB.send(new ScanCommand(params));
    const count = data.Count || 0;  // `data.Count` contiene el número de ítems en la tabla
    return count + 1;  
  } catch (err) {
    console.error("Error al contar los ítems en la tabla:", err);
    throw err;
  }
};

const getCreationDateById = async (id) => {
  const params = {
    TableName: 'testing',
    KeyConditionExpression: 'testingId = :id',
    ExpressionAttributeValues: {
      ':id': { S: id.toString() } 
    },
    ProjectionExpression: 'creationDate' 
  };

  try {
    const data = await dynamoDB.send(new QueryCommand(params));
    if (data.Items && data.Items.length > 0 && data.Items[0].creationDate) {
      return data.Items[0].creationDate.S;
    } else {
      throw new Error('Elemento no encontrado o no tiene fecha de creación');
    }
  } catch (error) {
    console.error("Error al obtener la fecha de creación:", error);
    throw error;
  }
};

//Agregar Usuario
app.post('/add_user', async (req, res) => {
  const { name, mail } = req.body;

  try {
    const newId = await getNextId();  // Obtener el próximo ID basado en el conteo de ítems

    //  (YYYY-MM-DD)
    const creationDate = new Date().toISOString().split('T')[0];

    const params = {
      TableName: 'testing',
      Item: {
        testingId: { S: newId.toString() },  
        Name: { S: name },
        Mail: { S: mail },
        creationDate: { S: creationDate }  
      },
    };

    await putItem(params);
    res.status(200).json({ message: "Usuario insertado con éxito" }); 
  } catch (error) {
    res.status(500).json({ error: "Error al insertar el usuario" });  
  }
});

//Consultar todos los usuarios
app.get('/get_users', async (req, res) => {
  try {
    const params = {
      TableName: 'testing'
    };
    const data = await getCollection(params);

    console.log(data);
    res.status(200).json(data);  
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar los usuarios' });
  }
});


//Borrar un Usuario
app.delete('/delete_user', async (req, res) => {
  const { id } = req.body; 

  console.log(req.body);

  try {
    // Primero, obtener la creationDate correspondiente al id
    const creationDate = await getCreationDateById(id);

    if (!creationDate) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }


    const params = {
      TableName: 'testing',
      Key: {
        testingId: { S: id.toString() }, 
        creationDate: { S: creationDate.toString() } 
      }
    };

    await deleteItem(params);
    res.status(200).json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el usuario" }); 
  }
});



// Ruta para 404
app.get('/404', (req, res) => {
  res.sendFile("404.html", { root: "public" });
});

// Redirección a 404 para rutas no encontradas
app.use((req, res) => {
  res.redirect('/404');
});

// Inicio del servidor
app.listen(3000, () => {
  console.log('Running on port 3000');
});
