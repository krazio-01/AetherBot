import { IMenuItem } from '@/types';
import './menu.css';

interface IMenuProps {
    position: {
        top: number | string;
        left: number | string;
    };
    onClose: () => void;
    items: IMenuItem[];
}

const Menu = ({ position, onClose, items }: IMenuProps) => {
    return (
        <>
            <div className="menu-backdrop" onClick={onClose} />
            <div
                className="menu"
                style={{
                    top: position.top,
                    left: position.left,
                }}
            >
                <ul>
                    {items.map((item, index) => (
                        <li key={index} onClick={item.onClick}>
                            {item.icon}
                            {item.content}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default Menu;
