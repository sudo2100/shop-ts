import { useNavigate, useParams } from "react-router-dom"
import { useProduct } from "../context/ProductContext";
import type { Product, ProductForm } from "../types/product";
import { useState } from "react";

const EditProductForm = ({product}: {product: Product}) => {
    // 처음 상품 값
    const initialForm: ProductForm = {
        pName: product.pName,
        category: product.category,
        price: product.price,
        description: product.description,
        image: product.image ?? ""
    }

    const [form, setForm] = useState<ProductForm>(initialForm);
    const [error, setError] = useState<string | null>(null);
    const { updateProduct } = useProduct();
    const navigate = useNavigate();

    const { pName, category, price, description, image} = form;

    // 입력값 변경 핸들러
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm({...form, [name]: value});
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // 유효성 검사
        if(!pName.trim()){
            setError("상품명을 입력해주세요.");
            return;
        }
        if(!price || price <= 0){
            setError("가격을 올바르게 입력해주세요.");
            return;
        }
        if(!description.trim()){
            setError("설명을 입력해주세요.");
            return;
        }
    
        try {
            // id는 그대로 두고 나머지 값을 바꿉니다.
            await updateProduct({
                id: product.id,
                pName,
                category,
                price: Number(price),
                description,
                image: image || undefined  // "" (선택 안 함)이면 undefined
            });
            alert("상품이 수정되었습니다.");
            // 수정한 상품의 상세 화면으로 이동
            navigate(`/product/${product.id}`);
        } catch {
            setError("상품 수정 중 오류가 발생했습니다.");
        }
    } //handleSubmit

     // 되돌리기 핸들러: 처음 값(지금 상품의 값)으로 돌아갑니다.
    const handleReset = () => {
        setForm(initialForm);
        setError(null);
    };

    return(
        <div className="product-add">
            <h2>상품 수정</h2>
            <form onSubmit={handleSubmit}>
            <div>
            <label htmlFor="pName">상품명:</label>
            <input
                type="text"
                id="pName"
                name="pName"
                value={pName}
                onChange={handleChange}
            />
            </div>
            <div>
            <label htmlFor="category">카테고리:</label>
            <select
                id="category"
                name="category"
                value={category}
                onChange={handleChange}
            >
                <option value="마우스">마우스</option>
                <option value="키보드">키보드</option>
                <option value="모니터">모니터</option>
                <option value="주변기기">주변기기</option>
            </select>
            </div>
            <div>
            <label htmlFor="price">가격:</label>
            <input
                type="number"
                id="price"
                name="price"
                value={price}
                onChange={handleChange}
            />
            </div>
            <div>
            <label htmlFor="description">설명:</label>
            <textarea
                id="description"
                name="description"
                value={description}
                onChange={handleChange}
            />
            </div>
            <div>
            <label htmlFor="image">이미지:</label>
            <select
                id="image"
                name="image"
                value={image}
                onChange={handleChange}
            >
                <option value="">선택 안 함</option>
                <option value="/images/mouse.png">마우스</option>
                <option value="/images/keyboard.png">키보드</option>
                <option value="/images/monitor.png">모니터</option>
                <option value="/images/usb-hub.png">USB-C 허브</option>
                <option value="/images/webcam.png">웹캠</option>
            </select>
            </div>
            {error && <p className="product-add_error">{error}</p>}
            <div className="product-add_buttons">
                <button type="submit">저장</button>
                <button type="button" onClick={handleReset}>취소</button>
            </div>
          </form>
        </div>
    )
}

const EditProduct = () => {
    const { id } = useParams<{id: string}>();
    const { products } = useProduct();

    // 해당 id의 상품 찾기(id는 숫자형으로 변환)
    const product = products.find(p => p.id === Number(id))

    // 필수-상품이 없는 경우 처리
    if(!product){
        return <div>상품을 찾을 수 없습니다.</div>
    }

    return <EditProductForm  product={product} />
}

export default EditProduct;