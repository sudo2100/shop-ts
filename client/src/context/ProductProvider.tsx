import { useEffect, useState } from "react"
import { ProductContext } from "./ProductContext"
import type {NewProduct, Product} from "../types/product"
import { 
    getProducts, 
    createProduct, 
    deleteProduct,
    modifyProduct
 } from "../api/products"

// ProductProvider는 저장소(repository) 역할
const ProductProvider = ({children} : {children: React.ReactNode}) => {
    const [products, setProducts] = useState<Product[]>([]);

    // 상품 목록 불러오기(화면이 렌더링될때 한 번 가져옴)
    useEffect(() => {
        getProducts()
            .then(setProducts)
            .catch(err => console.log("상품 목록 조회 오류", err))
    }, []);
    
    // 상품 추가 함수
    const addProduct = async (newProduct: NewProduct) => {
        await createProduct(newProduct); // DB에 상품 등록
        setProducts(await getProducts()); // 등록된 상품을 배열에 저장
    }

    // 상품 삭제 함수
    const removeProduct = async (productId: number) => {
        await deleteProduct(productId); //삭제
        // 이미 등록한 상품과 삭제를 누른 상품 아이디가 다른 상품 저장
        setProducts(products.filter(product => product.id != productId));
    }

    // 상품 수정 함수
    const updateProduct = async (updatedProduct: Product) => {
        await modifyProduct(updatedProduct);  //데이터 수정
        setProducts(products.map(product =>
            product.id === updatedProduct.id ? updatedProduct : product
        ));
    }

    return(
        <ProductContext.Provider value={{
            products, 
            addProduct,
            removeProduct,
            updateProduct
        }}>
            {children}
        </ProductContext.Provider>
    )
}

export default ProductProvider