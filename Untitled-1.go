    // write a program that'll recieve the following information about a student
    // 1. to recieve the full name of the student 
    // 2. the age of the student 
    // 3. the gender  of the student as a single charecter m for male f for female (m or f)
    // your program should thereafter calculate the student's year of birth by subtracting their age from the curretn year of 2025
    // display your full name, age and gender as an output. 


    Start 
    fullName as string
    age as int 
    gender as char
    year_of_birth as int 
        output "enter full name" 
        input fullName
        output "enter age"
        input age
        output "enter gender (m or f)"
        input gender
        year_of_birth = 2025 - age
        output year_of_birth
        output full_Name
        output age
        output gender
    stop


    #include <iostream>
using namespace std;

int main(){
    string fullName;
    int age;
    char gender;
    int yearOfBirth;
    cout<< "enter your full names " << endl;
    cin >> fullName ;
    cout<< "enter your age" << endl;
    cin >> age;
    cout << "enter your gender ( M or F)"<<endl;
    cin >> gender;
    yearOfBirth = 2025 - age;
    cout<< yearOfBirth << endl;
    cout<< fullName<<endl;
    cout<< age<<endl;
    cout<< gender<<endl;
    cout<< yearOfBirth<<endl;
    return 0;

}


    // write a program that'll convert the following mathematical expression into c++ code 
    a,b,c,d are inputs to the program
    c = a^5 * sqrtroot (ab)^2 + d

    
    PEMDAS (PARENTHESIS, EXPONENTS, MULTIPLICATION, DIVISION, ADDITION AND SUBTRACTION)

    //d= square root of a^2 + (b-a)^3 /b. inputs a and b;