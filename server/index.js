import express from 'express'
import pg from 'pg'
import cors from 'cors'
import bcrypt from 'bcrypt'
import session from 'express-session'

// express 객체 생성
const app = express();
const PORT = 8000;

// cors - 요청하는 모든 주소 허용
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// 세션 설정
/* 쿠키 - 서버(메모)가 브라우저에 맡겨 두는 작은 값. 한 번 받으면 브라우저가
   같은 서버로 요청할 때마다 자동으로 함께 보낸다. 
   세션 방식은 쿠키에 회원 정보가 아니라 세션 ID(번호표)만 넣고, 실제 
   회원 정보는 서버가 가지고 있다.
   서버를 다시 시작하면 모든 세션이 사라져 다시 로그인 해야 한다.
*/
app.use(session({
    secret: "space-shop-secret", // 비밀키(세션 ID - 쿠키)
    resave: false,  // 바뀐 곳이 없으면 다시 저장하지 않음
    saveUninitialized: false,  // 로그인하기 전에는 세션을 만들지 않음
    cookie: {
        httpOnly: true,  //쿠키를 읽을 수 없게함
        maxAge: 1000 * 60 * 60   //ms * 60초 * 60분 - 1시간
    }  
}))

// 본문 요청 파싱 - 상품등록, 회원가입
app.use(express.json());

// 로그인했는지 확인하는 함수 - 인증(Authentication)
const requireLogin = (req, res, next ) => {
    if(!req.session.user){
        return res.status(401).send("로그인이 필요합니다.")
    }
    next();
}

// 관리자인지 확인 - 권한(role)
const requireAdmin = (req, res, next ) => {
    if(req.session.user?.role !== "admin"){
        return res.status(403).send("관리자만 사용할 수 있습니다.")
    }
    next();
}

// DB 연결
const db = new pg.Client({
    host: "localhost",
    user: "jsuser",
    password: "pwjs",
    database: "tsdb"
})

try{
    await db.connect();
    console.log("PostgreSQL 연결 성공!");
}catch(err){
    console.error("PostgreSQL 연결 실패!", err.message);
}

// 기본 라우터
app.get("/", (req, res) => {
    res.send("<h1>쇼핑몰 서버 API 개발</h1>")
})

// 상품 목록 조회
app.get("/api/products", async (req, res) => {
    const sql = "SELECT * FROM products";
    try{
        const result = await db.query(sql); //db에서 꺼내온 데이터
        res.json(result.rows);  //요청한 곳에 반환
    }catch(err){
        // 500: 코드 오류
        console.error("상품 목록 조회 오류!!", err);
        res.status(500).send("상품 목록 조회 오류!!")
    }
});

// 상품 1건 조회
app.get("/api/products/:id", async (req, res) => {
    const pid = req.params.id;  //id 받아오기
    const sql = "SELECT * FROM products WHERE id = $1";
    try{
        const result = await db.query(sql, [pid]); //db에서 꺼내온 데이터
        res.json(result.rows[0]);  //요청한 곳에 반환
    }catch(err){
        console.error("상품 조회 오류!!", err);
        res.status(500).send("상품 조회 오류!!")
    }
});

// 상품 등록
app.post("/api/products", requireAdmin, async (req, res) => {
    const { pName, category, price, description, image} = req.body;
    const sql = "INSERT INTO products(p_name, category, price, description, "
       + " image) VALUES ($1, $2, $3, $4, $5)";
    try{
        await db.query(sql, [pName, category, price, description, image ?? null]);
        res.send("상품 등록 완료!");
    }catch(err){
         console.error("상품 등록 오류!!", err);
        res.status(500).send("상품 등록 오류!!")
    }
})

// 상품 삭제
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    const pid = req.params.id;  //id 받아오기
    const sql = "DELETE FROM products WHERE id = $1";
    try{
        await db.query(sql, [pid]); //db에서 꺼내온 데이터
        res.send("상품 삭제 완료!")  //요청한 곳에 반환
    }catch(err){
        console.error("상품 삭제 오류!!", err);
        res.status(500).send("상품 삭제 오류!!")
    }
});

// 상품 수정
app.put("/api/products/:id", requireAdmin, async (req, res) => {
    const pid = req.params.id;
    const { pName, category, price, description, image} = req.body;
    const sql = "UPDATE products SET p_name=$1, category=$2, price=$3, "
         + " description=$4, image=$5 WHERE id = $6";
    try{
        await db.query(sql, [pName, category, price, description, image ?? null, pid]);
        res.send("상품 수정 완료!");
    }catch(err){
        console.error("상품 수정 오류!!", err);
        res.status(500).send("상품 수정 오류!!")
    }
})

// 회원 목록
app.get("/api/users", async (req, res) => {
    const sql = "SELECT * FROM users";
    try{
        const result = await db.query(sql);
        res.json(result.rows);  //요청한 곳으로 json형식으로 반환
    }catch(err){
        console.error("회원 목록 조회 오류!!", err);
        res.status(500).send("회원 목록 조회 오류!!")
    } 
});

// 로그인
/*app.post("/api/users/login", async (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE "
            + "username=$1 AND password=$2 ";
    try{
        const result = await db.query(sql, [username, password]);
        // 401: 인증실패,  404: 페이지를 찾을 수 없을때
        if(result.rows.length === 0){
            return res.status(401).send("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
        res.json({
            message: "로그인 성공",
            user: result.rows[0]
        });  //요청한 곳으로 json형식으로 반환
    }catch(err){
        console.error("회원 로그인 중 오류!!", err);
        res.status(500).send("회원 로그인 중 오류!!")
    } 
});*/

// 회원 가입
app.post("/api/users", async (req, res) => {
    const { username, password, name, email } = req.body;
    const sql = "INSERT INTO users(username, password, name, email) "
            + "VALUES ($1, $2, $3, $4)";
    try{
        // 비밀번호 암호화(해시)해서 저장. 10은 암호화 반복 정도
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(sql, [username, hashedPassword, name, email]);
        res.send("회원 가입 완료!");
    }catch(err){
        console.error("회원가입 중 오류!!", err);
        res.status(500).send("회원가입 중 오류!!")
    } 
});

// 로그인 - 비밀번호 암호화
app.post("/api/users/login", async (req, res) => {
    const { username, password } = req.body;
    // 아이디로 회원을 찾음
    const sql = "SELECT * FROM users WHERE username=$1";
    try{
        const result = await db.query(sql, [username]);
        const user = result.rows[0];

        // 회원이 없거나 입력한 비밀번호가 저장된 해시와 맞지 않으면 실패
        if(!user || !(await bcrypt.compare(password, user.password))){
            return res.status(401).send("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
        // 응답에서 비밀번호를 빼고 나머지만 보낸다.
        // userInfo - {id, username, name, email, role}
        const { password: _, ...userInfo } = user;
        req.session.user = userInfo; // 세션에 로그인 정보 저장
        res.json({
            message: "로그인 성공",
            user: userInfo
        });  //요청한 곳으로 json형식으로 반환
    }catch(err){
        console.error("회원 로그인 중 오류!!", err);
        res.status(500).send("회원 로그인 중 오류!!")
    } 
});

// 로그인 확인: 새로고침해도 세션에 남아 있는 회원정보 돌려준다
app.get("/api/users/me", requireLogin, (req, res) => {
    res.json(req.session.user);
})

// 로그아웃: 서버의 세션을 지우고 쿠키도 지운다
app.post("/api/users/logout", (req, res) => {
    req.session.destroy(() => { // 세션 삭제
        res.clearCookie("connect.id");
        res.send("로그아웃 완료!");
    });
});

// 회원 정보 변경(이름, 이메일)
app.put("/api/users/:id", requireLogin, async (req, res) => {
    if(req.session.user.id !== Number(req.params.id)){
        return res.status(403).send("본인 정보만 수정할 수 있습니다.")
    }
    
    const uid = req.params.id;
    const { name, email } = req.body;

    // RETURNING - 수정한 데이터를 검색하는 용어(PostgreSQL 전용)
    const sql = "UPDATE users SET name=$1, email=$2 WHERE id=$3 "
        + "RETURNING id, username, name, email, role, created_at";
    try{
       const result = await db.query(sql, [name, email, uid]);
        if(result.rows.length === 0){
            return res.status(404).send("회원을 찾을 수 없습니다.");
        }
        req.session.user = result.rows[0];  // 세션의 회원 정보 값
        res.json(result.rows[0]);  //변경된 정보 반환
    }catch(err){
        // email - UNIQUE 위반: 23505
        if(err.code === "23505"){
            return res.status(409).send("이미 사용중인 이메일입니다.");
        }
        console.error("회원 로그인 중 오류!!", err);
        res.status(500).send("회원 로그인 중 오류!!")
    }
})

// 서버 실행
app.listen(PORT, () => {
    console.log(`서버 실행중... http://localhost:${PORT}`);
})