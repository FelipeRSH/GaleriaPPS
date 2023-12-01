const express = require('express');
const fs = require('fs/promises');
const bodyParser = require('body-parser');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 3000;
const axios = require('axios');
const path = require('path');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'secretpassword', resave: true, saveUninitialized: true }));

const ARQUIVO_BANCO_DE_DADOS = 'fakeDatabase.json';

// Função para ler dados do arquivo de banco de dados falso
const lerBancoDeDados = async () => {
  try {
    const dados = await fs.readFile(ARQUIVO_BANCO_DE_DADOS, 'utf-8');
    return JSON.parse(dados);
  } catch (erro) {
    return { usuarios: [], alunos: [], turmas: [] };
  }
};

// Função para escrever dados no arquivo de banco de dados falso
const escreverBancoDeDados = async (dados) => {
  await fs.writeFile(ARQUIVO_BANCO_DE_DADOS, JSON.stringify(dados, null, 2), 'utf-8');
};

// Middleware para verificar se o usuário está autenticado
const verificarAutenticacao = (req, res, next) => {
  if (req.session && req.session.usuario) {
    return next();
  } else {
    res.redirect('/login');
  }
};



// Rota de autenticação
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  console.log(senha)
  const { usuarios } = await lerBancoDeDados();
  const usuarioAutenticado = usuarios.find((usuario) => usuario.email === email && usuario.senha === senha);

  if (usuarioAutenticado) {
    req.session.usuario = usuarioAutenticado;
    res.redirect('/');
  } else {
    res.send('Credenciais inválidas. Tente novamente.');
  }
});

// Página de login
app.get('/login', (req, res) => {
  const filePath = path.join(__dirname, 'templates', 'login.html');
  res.sendFile(filePath);
});
app.get('/', verificarAutenticacao, (req, res) => {

  const filePath = path.join(__dirname, 'templates', 'index.html');
  res.sendFile(filePath);
});
// Página inicial alunos app com operações CRUD
app.get('/app-alunos', verificarAutenticacao, (req, res) => {

  const filePath = path.join(__dirname, 'templates', 'index-alunos.html');
  res.sendFile(filePath);
});

// Página inicial produtos app com operações CRUD
app.get('/app-produtos', verificarAutenticacao, (req, res) => {
  
  const filePath = path.join(__dirname, 'templates', 'index-produtos.html');
  res.sendFile(filePath);
});

// Página inicial cnpj app com operações CRUD
app.get('/app-cnpj', verificarAutenticacao, (req, res) => {
  const filePath = path.join(__dirname, 'templates', 'consulta.html');
  res.sendFile(filePath);
});

// Página inicial cnpj app com operações CRUD
app.get('/app-cep', verificarAutenticacao, (req, res) => {
  const filePath = path.join(__dirname, 'templates', 'endereco.html');
  res.sendFile(filePath);
});

// Rotas CRUD para usuarios
app.get('/usuarios', verificarAutenticacao, async (req, res) => {
  const { usuarios } = await lerBancoDeDados();
  res.json(usuarios);
});

app.post('/usuarios', verificarAutenticacao, async (req, res) => {
  const { email, senha } = req.body;
  const database = await lerBancoDeDados();
  const novoUsuario = { email, senha };
  database.usuarios.push(novoUsuario);
  await escreverBancoDeDados(database);
  res.json(novoUsuario);
});

// Rotas CRUD para alunos
app.get('/alunos', verificarAutenticacao, async (req, res) => {
  const { alunos } = await lerBancoDeDados();
  res.json(alunos);
});

app.post('/alunos', verificarAutenticacao, async (req, res) => {
  
  const { nome, turmas, cod_usuario } = req.body;

  const alunoId = uuidv4();

  const novoAluno = { id: alunoId, nome, turmas, cod_usuario };

  
  if(nome.length <2){
    return;
  }
  const database = await lerBancoDeDados();
  database.alunos.push(novoAluno);

  await escreverBancoDeDados(database);
  res.json(novoAluno);
});

app.put('/alunos/:id', verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  const { nome, turmas } = req.body;
  if(nome.length <2){
    return;
  }
  const database = await lerBancoDeDados();
  const index = database.alunos.findIndex((aluno) => aluno.id === id);

  if (index !== -1) {
    database.alunos[index] = { id, nome, turmas };
    await escreverBancoDeDados(database);
    res.json(database.alunos[index]);
  } else {
    res.status(404).json({ error: 'Aluno não encontrado' });
  }
});

app.delete('/alunos/:id', verificarAutenticacao, async (req, res) => {
  const { id } = req.params;

  const database = await lerBancoDeDados();
  const index = database.alunos.findIndex((aluno) => aluno.id === id);

  if (index !== -1) {
    const deletedAluno = database.alunos.splice(index, 1)[0];
    await escreverBancoDeDados(database);
    res.json(deletedAluno);
  } else {
    res.status(404).json({ error: 'Aluno não encontrado' });
  }
});

// Rotas CRUD Produtos
app.get('/produtos', verificarAutenticacao, async (req, res) => {
  const { produtos } = await lerBancoDeDados();
  res.json(produtos);
});

app.post('/produtos', verificarAutenticacao, async (req, res) => {
  const { categoria, descricao, quantidade, armazem, cod_usuario } = req.body;

  const produtoId = uuidv4();

  const novoProduto = { id: produtoId, categoria, descricao, quantidade, armazem, cod_usuario };

  if (descricao.length < 2) {
      return;
  }

  const database = await lerBancoDeDados();
  database.produtos.push(novoProduto);

  await escreverBancoDeDados(database);
  res.json(novoProduto);
});

app.put('/produtos/:id', verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  const { categoria, descricao, quantidade, armazem } = req.body;

  if (descricao.length < 2) {
      return;
  }

  const database = await lerBancoDeDados();
  const index = database.produtos.findIndex((produto) => produto.id === id);

  if (index !== -1) {
      database.produtos[index] = { id, categoria, descricao, quantidade, armazem };
      await escreverBancoDeDados(database);
      res.json(database.produtos[index]);
  } else {
      res.status(404).json({ error: 'Produto não encontrado' });
  }
});

app.delete('/produtos/:id', verificarAutenticacao, async (req, res) => {
  const { id } = req.params;

  const database = await lerBancoDeDados();
  const index = database.produtos.findIndex((produto) => produto.id === id);

  if (index !== -1) {
      const deletedProduto = database.produtos.splice(index, 1)[0];
      await escreverBancoDeDados(database);
      res.json(deletedProduto);
  } else {
      res.status(404).json({ error: 'Produto não encontrado' });
  }
});


// Controller para obter dado CNPJ
app.get('/cnpj', verificarAutenticacao, async (req, res) => {
  try {
      const cnpj = req.query.cnpj; 
      if (!cnpj) {
          return res.status(400).json({ error: 'CNPJ não informado' });
      }
      // O Servidor irá fazer um Proxy para obter os dados retornados pelo payload externo.
      const url = `https://publica.cnpj.ws/cnpj/${cnpj}`;
      const response = await axios.get(url);

      res.json(response.data);
  } catch (error) {
      console.error('Error fetching CNPJ data:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Controller para obter dados viaCEP
app.get('/cep', verificarAutenticacao, async (req, res) => {
  try {
    const cep = req.query.cep;

    if (!cep) {
      return res.status(400).json({ error: 'CEP não informado' });
    }

    const url = `https://viacep.com.br/ws/${cep}/json/`;
    const response = await axios.get(url);

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao obter dados do CEP:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor está rodando em http://localhost:${PORT}`);
});
